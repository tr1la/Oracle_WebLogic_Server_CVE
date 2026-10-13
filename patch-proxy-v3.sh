#!/usr/bin/env bash
# patch-proxy-v3.sh — add --socks flag for T3/IIOP raw TCP via SOCKS5
#
# Traffic flow:
#   HTTP  (console probe + HTTP templates) -> Burp (--proxy) -> upstream SOCKS -> target
#   T3/IIOP probes (ncat)                  -> SOCKS5 direct (--socks)          -> target
#   T3/IIOP templates (nuclei JS)          -> proxychains4 -> SOCKS5           -> target
#
# Usage: bash patch-proxy-v3.sh
# Then:  ./scan-weblogic.sh --proxy http://127.0.0.1:8080 --socks 116.101.14.169:1080

SCRIPT="scan-weblogic.sh"

python3 - "$SCRIPT" <<'PYEOF'
import sys
f = sys.argv[1]
s = open(f).read()
changes = 0

# ── 1. Add SOCKS variable ──
old_vars = 'PROXY=""'
new_vars = 'PROXY=""\nSOCKS=""'
if 'SOCKS=""' not in s and old_vars in s:
    s = s.replace(old_vars, new_vars, 1)
    changes += 1
    print("  [OK] Added SOCKS variable")

# ── 2. Add --socks flag parsing ──
old_parse = "    --proxy)     PROXY=\"$2\"; shift 2 ;;"
new_parse = "    --proxy)     PROXY=\"$2\"; shift 2 ;;\n    --socks)     SOCKS=\"$2\"; shift 2 ;;"
if '--socks)' not in s and old_parse in s:
    s = s.replace(old_parse, new_parse, 1)
    changes += 1
    print("  [OK] Added --socks flag parsing")

# ── 3. Add SOCKS info + proxychains config after proxy block ──
socks_block = '''
if [[ -n "$SOCKS" ]]; then
  echo "[*] SOCKS5: $SOCKS (T3/IIOP raw TCP routed through SOCKS)"
  PROXYCHAINS_CONF="$WORK_DIR/proxychains.conf"
  SOCKS_HOST="${SOCKS%%:*}"
  SOCKS_PORT="${SOCKS##*:}"
  cat > "$PROXYCHAINS_CONF" <<PCEOF
strict_chain
proxy_dns
[ProxyList]
socks5 $SOCKS_HOST $SOCKS_PORT
PCEOF
fi'''

anchor = 'mkdir -p "$WORK_DIR"'
if 'PROXYCHAINS_CONF' not in s and anchor in s:
    s = s.replace(anchor, anchor + '\n' + socks_block, 1)
    changes += 1
    print("  [OK] Added SOCKS info + proxychains config generation")

# ── 4. T3/IIOP probes: ncat --proxy-type socks5 ──
old_probe_line = '  # Probes go direct (benign 1-packet detection, not proxied)'
new_probe_block = '''  local nc_cmd="nc -w 5"
  if [[ -n "$SOCKS" ]]; then
    nc_cmd="ncat --proxy-type socks5 --proxy $SOCKS"
  fi'''

if old_probe_line in s:
    s = s.replace(old_probe_line, new_probe_block, 1)
    # replace the two "nc -w 5" in probes with $nc_cmd
    # only replace inside the scan_surface function (after our insertion)
    probe_section_start = s.find(new_probe_block)
    probe_section_end = s.find('echo "$surfaces"', probe_section_start)
    section = s[probe_section_start:probe_section_end]
    section = section.replace('nc -w 5 "$host"', '$nc_cmd "$host"')
    s = s[:probe_section_start] + section + s[probe_section_end:]
    changes += 1
    print("  [OK] T3/IIOP probes: ncat --proxy-type socks5 when --socks set")
elif 'nc -w 5 "$host"' in s and 'nc_cmd' not in s:
    # fallback: just add nc_cmd before the T3 probe
    old_t3 = '  # ── T3 probe: send T3 handshake, look for HELO ──'
    if old_t3 in s:
        s = s.replace(old_t3, new_probe_block + '\n\n' + old_t3, 1)
        probe_section_start = s.find(new_probe_block)
        probe_section_end = s.find('echo "$surfaces"', probe_section_start)
        section = s[probe_section_start:probe_section_end]
        section = section.replace('nc -w 5 "$host"', '$nc_cmd "$host"')
        s = s[:probe_section_start] + section + s[probe_section_end:]
        changes += 1
        print("  [OK] T3/IIOP probes: added ncat socks5 support (fallback path)")

# ── 5. Nuclei T3/IIOP: wrap with proxychains4 ──
old_raw = '''    nuclei -u "$url" \\
      "${raw_tpls[@]}" \\
      -timeout "$TIMEOUT" \\
      -rate-limit "$RATE_LIMIT" \\
      -no-color -jsonl -silent \\
      >> "$result_file" \\
      2>/dev/null || true'''

new_raw = '''    local nuclei_wrap=""
    if [[ -n "$SOCKS" && -f "${PROXYCHAINS_CONF:-/dev/null}" ]] && command -v proxychains4 &>/dev/null; then
      nuclei_wrap="proxychains4 -q -f $PROXYCHAINS_CONF"
    fi
    $nuclei_wrap nuclei -u "$url" \\
      "${raw_tpls[@]}" \\
      -timeout "$TIMEOUT" \\
      -rate-limit "$RATE_LIMIT" \\
      -no-color -jsonl -silent \\
      >> "$result_file" \\
      2>/dev/null || true'''

if old_raw in s:
    s = s.replace(old_raw, new_raw, 1)
    changes += 1
    print("  [OK] Nuclei T3/IIOP: wrapped with proxychains4 when --socks set")

open(f, "w").write(s)
print(f"\n  Done. {changes}/5 patches applied.")
PYEOF

echo ""
echo "=== Usage ==="
echo "  brew install proxychains-ng    # if not installed"
echo "  ./scan-weblogic.sh --proxy http://127.0.0.1:8080 --socks 116.101.14.169:1080"
