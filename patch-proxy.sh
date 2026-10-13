#!/usr/bin/env bash
# Apply proxy support to scan-weblogic.sh
# Usage: bash patch-proxy.sh

SCRIPT="scan-weblogic.sh"

# 1. Replace T3 + IIOP probe section to support proxy via ncat
cat > /tmp/old_probe.txt <<'OLD'
  # ── T3 probe: send T3 handshake, look for HELO ──
  if echo -ne "t3 12.2.1\nAS:255\nHL:19\nMS:10000000\nPU:t3://x:7001\n\n" | \
     timeout "$TIMEOUT" nc -w 5 "$host" "$port" 2>/dev/null | grep -qi "HELO"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},T3" || surfaces="T3"
  fi

  # ── IIOP probe: send minimal GIOP bytes, look for GIOP response ──
  if printf '\x47\x49\x4f\x50\x01\x00\x00\x00\x00\x00\x00\x24\x00\x00\x00\x00' | \
     timeout "$TIMEOUT" nc -w 5 "$host" "$port" 2>/dev/null | grep -q "GIOP"; then
    [[ -n "$surfaces" ]] && surfaces="${surfaces},IIOP" || surfaces="IIOP"
  fi
OLD

cat > /tmp/new_probe.txt <<'NEW'
  # ── T3 probe: send T3 handshake, look for HELO ──
  local nc_cmd
  if [[ -n "$PROXY" ]]; then
    local proxy_host proxy_port
    proxy_host=$(echo "$PROXY" | sed -E 's|^https?://||;s|:.*||')
    proxy_port=$(echo "$PROXY" | sed -E 's|.*:||;s|/.*||')
    nc_cmd="ncat --proxy $proxy_host:$proxy_port --proxy-type http"
  else
    nc_cmd="nc -w 5"
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
NEW

# Use python to do the replacement (sed can't handle multiline well)
python3 - "$SCRIPT" <<'PY'
import sys
f = sys.argv[1]
old = open("/tmp/old_probe.txt").read()
new = open("/tmp/new_probe.txt").read()
s = open(f).read()
if old in s:
    s = s.replace(old, new)
    print("  [OK] T3/IIOP probe patched with proxy support")
else:
    print("  [SKIP] T3/IIOP probe section not found (already patched?)")

# 2. Add -proxy to nuclei command
old_nuclei = '''  nuclei -u "$url" \\
    "${templates[@]}" \\
    -timeout "$TIMEOUT" \\
    -rate-limit "$RATE_LIMIT" \\
    -no-color \\
    -jsonl \\
    -silent \\
    -o "$result_file" \\
    2>/dev/null || true'''

new_nuclei = '''  local nuclei_proxy=()
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

if old_nuclei in s:
    s = s.replace(old_nuclei, new_nuclei)
    print("  [OK] nuclei -proxy patched")
else:
    print("  [SKIP] nuclei command not found (already patched?)")

open(f, "w").write(s)
print("  Done.")
PY

rm -f /tmp/old_probe.txt /tmp/new_probe.txt
echo ""
echo "Patched. Usage:"
echo "  ./scan-weblogic.sh --proxy http://127.0.0.1:8080 --rows 2-79"
echo ""
echo "Burp setup: Settings > Network > Connections > SOCKS proxy"
echo "  Host: 116.101.14.169  Port: 1080"
