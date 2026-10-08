#!/usr/bin/env python3
"""So khớp WebLogicScan2.json (mới) vs WeblogicScan.json (cũ) trên NHIỀU chiều:
IP:PORT, URL đầy đủ, và FQDN (FOFA: site/hostname/url ; ZoomEye: host/link/domain).
Mục đích: lộ ra host/domain mới bị sót khi chỉ so IP:PORT.
Chạy: python3 compare_hosts2.py
"""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
OLD = os.path.join(BASE, "WeblogicScan.json")
NEW = os.path.join(BASE, "WebLogicScan2.json")

def as_list(v):
    if isinstance(v, str): return [v] if v else []
    if isinstance(v, list): return v
    return []

def g(o, k):
    v = o.get(k); return v.strip() if isinstance(v, str) else ''

def strip_hostport(s):
    """bỏ scheme + path, trả host (giữ nguyên subdomain), bỏ :port."""
    if not s: return ''
    if '://' in s: s = s.split('://', 1)[1]
    s = s.split('/', 1)[0]
    s = s.rsplit(':', 1)[0] if ':' in s else s
    return s.strip().lower()

def is_ip(h):
    p = h.split('.')
    return len(p) == 4 and all(x.isdigit() for x in p)

FQDN_FIELDS = ('site', 'hostname', 'host', 'domain')   # field chuỗi đơn
URL_FIELDS = ('url', 'link')                            # field URL -> bóc host-part

def extract(path):
    ipports = set(); urls = set(); fqdns = set()
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line: continue
            o = json.loads(line)
            port = str(o.get('port') or '')
            for ip in as_list(o.get('ip')):
                ipports.add(f"{ip}:{port}" if port else ip)
            # gom FQDN từ MỌI field khả dĩ (không phụ thuộc nhãn engine)
            cands = [g(o, k) for k in FQDN_FIELDS]
            cands += [g(o, k) for k in URL_FIELDS]
            cands += [str(x) for x in as_list(o.get('domains'))]
            cands += [str(x) for x in as_list(o.get('http_title'))]
            for c in cands:
                h = strip_hostport(c)
                if h and not is_ip(h) and '.' in h:
                    fqdns.add(h)
            for k in URL_FIELDS:
                u = g(o, k)
                if u: urls.add(u.strip().lower())
    return ipports, urls, fqdns

o_ip, o_url, o_fq = extract(OLD)
n_ip, n_url, n_fq = extract(NEW)

def report(name, old, new):
    added = sorted(new - old); removed = sorted(old - new)
    print(f"\n### {name}:  cũ={len(old)}  mới={len(new)}  (+{len(added)} / -{len(removed)})")
    return added, removed

print("=" * 64)
add_ip, _   = report("IP:PORT", o_ip, n_ip)
add_url, _  = report("URL đầy đủ (url/link)", o_url, n_url)
add_fq, _   = report("FQDN (site FOFA / host ZoomEye)", o_fq, n_fq)
print("=" * 64)

print(f"\n>>> FQDN MỚI ({len(add_fq)}):")
for d in add_fq: print("   +", d)

with open(os.path.join(BASE, "weblogic-new-fqdns.txt"), "w") as f:
    for d in add_fq: f.write(d + "\n")
with open(os.path.join(BASE, "weblogic-new-urls.txt"), "w") as f:
    for u in add_url: f.write(u + "\n")
print(f"\nDa ghi: weblogic-new-fqdns.txt ({len(add_fq)}), weblogic-new-urls.txt ({len(add_url)})")
