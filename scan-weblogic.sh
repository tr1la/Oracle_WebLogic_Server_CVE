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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)   DRY_RUN=true; shift ;;
    --rows)      IFS='-' read -r ROW_START ROW_END <<< "$2"; shift 2 ;;
    --timeout)   TIMEOUT="$2"; shift 2 ;;
    --rate)      RATE_LIMIT="$2"; shift 2 ;;
    --proxy)     PROXY="$2"; shift 2 ;;
    --socks)     SOCKS="$2"; shift 2 ;;
    --socks-auth) SOCKS_AUTH="$2"; shift 2 ;;
    *)           echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -n "$PROXY" ]]; then
  echo "[*] Proxy: $PROXY (all HTTP + nuclei traffic routed through proxy)"
fi

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
python3 - "$EXCEL" "$ROW_START" "$ROW_END" "$TARGETS_FILE" <<'PYEXTRACT'
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

  # ── HTTP probe: check if WebLogic Console is reachable ──
  local console_url="${url%/}/console/login/LoginForm.jsp"
  local http_code
  local curl_proxy=()
  [[ -n "$PROXY" ]] && curl_proxy=(-x "$PROXY")
  http_code=$(curl -sk -o /dev/null -w '%{http_code}' \
    "${curl_proxy[@]}" \
    --connect-timeout 10 --max-time "$TIMEOUT" \
    "$console_url" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" || "$http_code" == "302" || "$http_code" == "301" ]]; then
    surfaces="HTTP"
  fi

  # ── T3 probe: send T3 handshake, look for HELO ──
  local nc_cmd="nc -w 5"
  if [[ -n "$SOCKS" ]]; then
    nc_cmd="ncat --proxy-type socks5 --proxy $SOCKS"
    [[ -n "$SOCKS_AUTH" ]] && nc_cmd="$nc_cmd --proxy-auth $SOCKS_AUTH"
  fi

  if echo -ne "t3 12.2.1\nAS:255\nHL:19\nMS:10000000\nPU:t3://x:7001\n\n" | \
     timeout "$TIMEOUT" $nc_cmd "$host" "$port" 2>/dev/null | grep -qi "HELO"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},T3" || surfaces="T3"
  fi

  # ── IIOP probe: send minimal GIOP bytes, look for GIOP response ──
  if printf '\x47\x49\x4f\x50\x01\x00\x00\x00\x00\x00\x00\x24\x00\x00\x00\x00' | \
     timeout "$TIMEOUT" $nc_cmd "$host" "$port" 2>/dev/null | grep -q "GIOP"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},IIOP" || surfaces="IIOP"
  fi

  [[ -z "$surfaces" ]] && surfaces="NONE"

  echo "$surfaces" > "$result_file"
  echo "  [row $row] $host:$port -> $surfaces"
}

while IFS=$'\t' read -r row url; do
  scan_surface "$row" "$url"
done < "$TARGETS_FILE"

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

  local templates=()
  local result_file="$RESULTS_DIR/row${row}.json"

  if [[ "$surfaces" == "NONE" ]]; then
    echo "  [row $row] no attack surface detected, skipping"
    : > "$result_file"
    return
  fi

  # HTTP templates: only if Console exposed
  if echo "$surfaces" | grep -q "HTTP"; then
    for t in "${HTTP_TEMPLATES[@]}"; do
      [[ -f "$t" ]] && templates+=("-t" "$t")
    done
  fi

  # T3 templates: only if T3 open
  if echo "$surfaces" | grep -q "T3"; then
    for t in "${T3_TEMPLATES[@]}"; do
      [[ -f "$t" ]] && templates+=("-t" "$t")
    done
  fi

  # IIOP templates: need T3 (version probe) + IIOP (delivery)
  if echo "$surfaces" | grep -q "T3" && echo "$surfaces" | grep -q "IIOP"; then
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
      "${nuclei_proxy[@]}" \
      -timeout "$TIMEOUT" \
      -rate-limit "$RATE_LIMIT" \
      -no-color -jsonl -silent \
      -o "$result_file" \
      2>/dev/null || true
  fi

  # T3/IIOP templates through SOCKS via proxychains4
  if [[ ${#raw_tpls[@]} -gt 0 ]]; then
    local nuclei_wrap=""
    if [[ -n "$SOCKS" && -f "${PROXYCHAINS_CONF:-/dev/null}" ]] && command -v proxychains4 &>/dev/null; then
      nuclei_wrap="proxychains4 -q -f $PROXYCHAINS_CONF"
    fi
    $nuclei_wrap nuclei -u "$url" \
      "${raw_tpls[@]}" \
      -timeout "$TIMEOUT" \
      -rate-limit "$RATE_LIMIT" \
      -no-color -jsonl -silent \
      >> "$result_file" \
      2>/dev/null || true
  fi

  local hits=0
  [[ -s "$result_file" ]] && hits=$(wc -l < "$result_file" | tr -d ' ')
  echo "  [row $row] -> $hits finding(s)"
}

while IFS=$'\t' read -r row url; do
  run_nuclei_for_target "$row" "$url"
done < "$TARGETS_FILE"

# ─── Phase 3: write results back to Excel ─────────────────────────────────────
echo ""
echo "[*] Phase 3: writing results to Excel..."

python3 - "$EXCEL" "$WORK_DIR" "$ROW_START" "$ROW_END" <<'PYWRITE'
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
