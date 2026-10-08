#!/usr/bin/env python3
"""So sánh WebLogicScan2.json (mới) với WeblogicScan.json (cũ): tìm host:port mới.
Chạy: python3 compare_hosts.py
"""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
OLD = os.path.join(BASE, "WeblogicScan.json")
NEW = os.path.join(BASE, "WebLogicScan2.json")

def as_list(v):
    if isinstance(v, str): return [v] if v else []
    if isinstance(v, list): return v
    return []

def load(path):
    hostports = set(); ips = set(); nrec = 0; bad = 0
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line: continue
            nrec += 1
            try:
                o = json.loads(line)
            except Exception:
                bad += 1; continue
            port = str(o.get('port') or '')
            for ip in as_list(o.get('ip')):
                ips.add(ip)
                hostports.add(f"{ip}:{port}" if port else ip)
    return hostports, ips, nrec, bad

old_hp, old_ip, old_n, old_bad = load(OLD)
new_hp, new_ip, new_n, new_bad = load(NEW)

added_hp = sorted(new_hp - old_hp)
removed_hp = sorted(old_hp - new_hp)
added_ip = sorted(new_ip - old_ip)
removed_ip = sorted(old_ip - new_ip)

print("=" * 60)
print(f"{'':22}{'CŨ':>12}{'MỚI':>12}")
print(f"{'Bản ghi (dòng)':22}{old_n:>12}{new_n:>12}")
print(f"{'host:port duy nhất':22}{len(old_hp):>12}{len(new_hp):>12}")
print(f"{'IP duy nhất':22}{len(old_ip):>12}{len(new_ip):>12}")
print("=" * 60)
print(f"Chênh lệch host:port : {len(new_hp)-len(old_hp):+d}  (= mới {len(added_hp)} - mất {len(removed_hp)})")
print(f"Chênh lệch IP        : {len(new_ip)-len(old_ip):+d}  (= mới {len(added_ip)} - mất {len(removed_ip)})")
print()
print(f">>> HOST:PORT MỚI (có trong file mới, KHÔNG có trong file cũ): {len(added_hp)}")
for h in added_hp: print("   +", h)
if removed_hp:
    print(f"\n>>> host:port MẤT (có ở cũ, không còn ở mới): {len(removed_hp)}")
    for h in removed_hp: print("   -", h)

with open(os.path.join(BASE, "weblogic-new-hosts.txt"), "w") as f:
    for h in added_hp:
        f.write(h + "\n")
print(f"\nDa ghi {len(added_hp)} host moi -> weblogic-new-hosts.txt")
