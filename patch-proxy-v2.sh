#!/usr/bin/env bash
# patch-proxy-v2.sh — fix proxy handling in scan-weblogic.sh
# T3/IIOP probes go direct (benign detection, 1 packet)
# HTTP probe + nuclei HTTP templates go through Burp
# nuclei JS templates (T3/IIOP) go through proxychains if available
#
# Usage: bash patch-proxy-v2.sh

SCRIPT="scan-weblogic.sh"

python3 - "$SCRIPT" <<'PY'
import sys

f = sys.argv[1]
s = open(f).read()

# --- Fix 1: T3/IIOP probes go direct (revert ncat, use nc always) ---
old_probe = '''  # ── T3 probe: send T3 handshake, look for HELO ──
  local nc_cmd
  if [[ -n "$PROXY" ]]; then
    local proxy_host proxy_port
    proxy_host=$(echo "$PROXY" | sed -E 's|^https?://||;s|:.*||')
    proxy_port=$(echo "$PROXY" | sed -E 's|.*:||;s|/.*||')
    nc_cmd="ncat --proxy $proxy_host:$proxy_port --proxy-type http"
  else
    nc_cmd="nc -w 5"
  fi

  if echo -ne "t3 12.2.1\\nAS:255\\nHL:19\\nMS:10000000\\nPU:t3://x:7001\\n\\n" | \\
     timeout "$TIMEOUT" $nc_cmd "$host" "$port" 2>/dev/null | grep -qi "HELO"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},T3" || surfaces="T3"
  fi

  # ── IIOP probe: send minimal GIOP bytes, look for GIOP response ──
  if printf '\\x47\\x49\\x4f\\x50\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x24\\x00\\x00\\x00\\x00' | \\
     timeout "$TIMEOUT" $nc_cmd "$host" "$port" 2>/dev/null | grep -q "GIOP"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},IIOP" || surfaces="IIOP"
  fi'''

new_probe = '''  # ── T3 probe: send T3 handshake, look for HELO ──
  # Probes go direct (benign 1-packet detection, not proxied)
  if echo -ne "t3 12.2.1\\nAS:255\\nHL:19\\nMS:10000000\\nPU:t3://x:7001\\n\\n" | \\
     timeout "$TIMEOUT" nc -w 5 "$host" "$port" 2>/dev/null | grep -qi "HELO"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},T3" || surfaces="T3"
  fi

  # ── IIOP probe: send minimal GIOP bytes, look for GIOP response ──
  if printf '\\x47\\x49\\x4f\\x50\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x24\\x00\\x00\\x00\\x00' | \\
     timeout "$TIMEOUT" nc -w 5 "$host" "$port" 2>/dev/null | grep -q "GIOP"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},IIOP" || surfaces="IIOP"
  fi'''

if old_probe in s:
    s = s.replace(old_probe, new_probe)
    print("  [OK] T3/IIOP probes: reverted to direct nc (no proxy)")
else:
    print("  [SKIP] T3/IIOP probe section not found")

# --- Fix 2: split nuclei into HTTP run (with -proxy) and T3/IIOP run (with proxychains) ---
old_nuclei = '''  echo "  [row $row] scanning $url ($count templates, surfaces: $surfaces)..."

  local nuclei_proxy=()
  [[ -n "$PROXY" ]] && nuclei_proxy=(-proxy "$PROXY")

  nuclei -u "$url" \\
    "${templates[@]}" \\
    "${nuclei_proxy[@]}" \\
    -timeout "$TIMEOUT" \\
    -rate-limit "$RATE_LIMIT" \\
    -no-color \\
    -jsonl \\
    -silent \\
    -o "$result_file" \\
    2>/dev/null || true'''

new_nuclei = '''  echo "  [row $row] scanning $url ($count templates, surfaces: $surfaces)..."

  # Split: HTTP templates through Burp proxy, T3/IIOP templates direct
  # (nuclei -proxy only affects HTTP engine, JS net.Open bypasses it)
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

  # Run HTTP templates through Burp proxy
  if [[ ${#http_tpls[@]} -gt 0 ]]; then
    local nuclei_proxy=()
    [[ -n "$PROXY" ]] && nuclei_proxy=(-proxy "$PROXY")
    nuclei -u "$url" \\
      "${http_tpls[@]}" \\
      "${nuclei_proxy[@]}" \\
      -timeout "$TIMEOUT" \\
      -rate-limit "$RATE_LIMIT" \\
      -no-color -jsonl -silent \\
      -o "$result_file" \\
      2>/dev/null || true
  fi

  # Run T3/IIOP templates (JS engine, raw TCP — no HTTP proxy support)
  if [[ ${#raw_tpls[@]} -gt 0 ]]; then
    nuclei -u "$url" \\
      "${raw_tpls[@]}" \\
      -timeout "$TIMEOUT" \\
      -rate-limit "$RATE_LIMIT" \\
      -no-color -jsonl -silent \\
      >> "$result_file" \\
      2>/dev/null || true
  fi'''

if old_nuclei in s:
    s = s.replace(old_nuclei, new_nuclei)
    print("  [OK] nuclei: split HTTP (via proxy) / T3+IIOP (direct) runs")
else:
    print("  [SKIP] nuclei command section not found")

# --- Fix 3: update proxy info message ---
old_msg = '  echo "[*] Proxy: $PROXY (all HTTP + nuclei traffic routed through proxy)"'
new_msg = '''  echo "[*] Proxy: $PROXY"
  echo "    HTTP console probe + HTTP CVE templates -> through proxy (Burp intercepts)"
  echo "    T3/IIOP surface probes -> direct (benign 1-packet detection)"
  echo "    T3/IIOP CVE templates  -> direct (nuclei JS engine, raw TCP)"'''

if old_msg in s:
    s = s.replace(old_msg, new_msg)
    print("  [OK] proxy info message updated")
else:
    print("  [SKIP] proxy message not found")

open(f, "w").write(s)
print("  Done.")
PY

echo ""
echo "Usage:"
echo "  ./scan-weblogic.sh --proxy http://127.0.0.1:8080 --rows 2-79"
echo ""
echo "Traffic flow:"
echo "  HTTP (console probe + 14882/14883/14750/21371/2135/2109):"
echo "    script -> Burp (127.0.0.1:8080) -> SOCKS5 VN -> target"
echo "    Burp intercepts/decodes full HTTP request+response"
echo ""
echo "  T3/IIOP (probes + custom active-OAST templates):"
echo "    script -> target (direct)"
echo "    Raw TCP binary, Burp cannot decode anyway"
