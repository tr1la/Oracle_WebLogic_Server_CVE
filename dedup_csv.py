#!/usr/bin/env python3
"""Gộp WLSfofa.csv + WLSzoomeye.csv, chuẩn hóa schema, lọc duplicate.
Xuất:
  - wls-dedup-ipport.csv : duy nhất theo IP:PORT (danh sách server WLS)
  - wls-dedup-vhost.csv  : duy nhất theo IP:PORT + domain (giữ từng vhost)
Chạy: python3 dedup_csv.py
"""
import csv, os, ipaddress

BASE = os.path.dirname(os.path.abspath(__file__))

def is_ip(s):
    try: ipaddress.ip_address(s); return True
    except Exception: return False

def clean_host(s):
    if not s: return ''
    s = s.strip()
    if '://' in s: s = s.split('://', 1)[1]
    s = s.split('/', 1)[0]
    if ':' in s and not s.count(':') > 1: s = s.rsplit(':', 1)[0]
    return s.strip().lower()

def norm_city(s):
    s = (s or '').strip()
    return '' if s in ('-', 'N/A', 'None') else s   # '-' = rỗng

def ascii_ok(s):
    try: s.encode('ascii'); return True
    except Exception: return False

def ensure_scheme(u, proto, port):
    """Đảm bảo URL có scheme (FOFA host đôi khi thiếu)."""
    u = (u or '').strip()
    if not u: return ''
    if '://' in u: return u
    sch = proto if proto in ('http', 'https') else ('https' if port in ('443', '8443', '7002') else 'http')
    return f"{sch}://{u}"

rows = []   # bản ghi chuẩn hóa

# --- FOFA: URL lấy từ field `host` ---
fp = os.path.join(BASE, "WLSfofa.csv")
if os.path.exists(fp):
    with open(fp, newline='', encoding='utf-8-sig') as f:   # utf-8-sig: bỏ BOM ở cột 'host'
        for r in csv.DictReader(f):
            ip = (r.get('ip') or '').strip(); port = (r.get('port') or '').strip()
            if not ip: continue
            proto = (r.get('protocol') or '').strip().lower()
            dom = clean_host(r.get('domain') or r.get('host') or '')
            if is_ip(dom): dom = ''
            rows.append({'ip': ip, 'port': port, 'domain': dom, 'scheme': proto,
                         'srcurl': ensure_scheme(r.get('host') or '', proto, port),
                         'title': (r.get('title') or '').strip(),
                         'city': norm_city(r.get('city')),
                         'org': (r.get('org') or '').strip(), 'src': 'fofa'})

# --- ZoomEye: URL lấy từ field `url` ---
zp = os.path.join(BASE, "WLSzoomeye.csv")
if os.path.exists(zp):
    with open(zp, newline='', encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            ip = (r.get('ip') or '').strip(); port = (r.get('port') or '').strip()
            if not ip: continue
            proto = (r.get('protocol') or '').strip().lower()
            dom = clean_host(r.get('domain') or '')
            if is_ip(dom): dom = ''
            rows.append({'ip': ip, 'port': port, 'domain': dom, 'scheme': proto,
                         'srcurl': ensure_scheme(r.get('url') or '', proto, port),
                         'title': (r.get('title') or '').strip(),
                         'city': norm_city(r.get('city')) or norm_city(r.get('subdivisions')),  # city rỗng/'-' -> subdivisions
                         'org': (r.get('isp') or '').strip(), 'src': 'zoomeye'})

def better_org(a, b):
    # ưu tiên org ASCII (tiếng Anh) hơn tiếng Trung
    if a and ascii_ok(a): return a
    if b and ascii_ok(b): return b
    return a or b

def url_has_letter(u):
    h = u.split('://', 1)[-1].split('/', 1)[0].rsplit(':', 1)[0]
    return any(c.isalpha() for c in h)

def merge_into(store, key, r):
    cur = store.get(key)
    if cur is None:
        store[key] = dict(r); return
    for fld in ('domain', 'title', 'city'):
        if not cur.get(fld) and r.get(fld): cur[fld] = r[fld]
    cur['org'] = better_org(cur.get('org', ''), r.get('org', ''))
    if r['scheme'] == 'https': cur['scheme'] = 'https'
    # srcurl: ưu tiên cái có domain (chữ); nếu cur đang là IP mà r có domain -> thay
    cs, rs = cur.get('srcurl', ''), r.get('srcurl', '')
    if rs and (not cs or (not url_has_letter(cs) and url_has_letter(rs))):
        cur['srcurl'] = rs

# ---- dedup theo IP:PORT ----
by_ipport = {}
for r in rows:
    merge_into(by_ipport, (r['ip'], r['port']), r)

# ---- dedup theo vhost (IP:PORT + domain) ----
by_vhost = {}
for r in rows:
    merge_into(by_vhost, (r['ip'], r['port'], r['domain']), r)

# lấp city rỗng từ cổng khác cùng IP (và org tương tự)
ip_city = {}; ip_org = {}
for r in by_ipport.values():
    if r.get('city') and r['ip'] not in ip_city: ip_city[r['ip']] = r['city']
    if r.get('org') and r['ip'] not in ip_org: ip_org[r['ip']] = r['org']
for store in (by_ipport, by_vhost):
    for r in store.values():
        if not r.get('city') and ip_city.get(r['ip']): r['city'] = ip_city[r['ip']]
        if not r.get('org') and ip_org.get(r['ip']): r['org'] = ip_org[r['ip']]

def url_of(r):
    # URL nguyên văn từ host(FOFA)/url(ZoomEye); fallback ghép nếu rỗng
    if r.get('srcurl'): return r['srcurl']
    host = r['domain'] if r['domain'] else r['ip']
    scheme = r['scheme'] if r['scheme'] in ('http', 'https') else ('https' if r['port'] in ('443','8443','7002') else 'http')
    pp = '' if r['port'] in ('', '80', '443') else ':' + r['port']
    return f"{scheme}://{host}{pp}"

def write_csv(path, recs):
    recs = sorted(recs, key=lambda r: (not bool(r['domain']), url_of(r)))
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['url', 'ip', 'port', 'scheme', 'domain', 'title', 'city', 'org'])
        for r in recs:
            w.writerow([url_of(r), r['ip'], r['port'], r['scheme'], r['domain'], r['title'], r['city'], r['org']])

write_csv(os.path.join(BASE, "wls-dedup-ipport.csv"), by_ipport.values())
write_csv(os.path.join(BASE, "wls-dedup-vhost.csv"), by_vhost.values())

uniq_ip = len({r['ip'] for r in rows})
uniq_fqdn = len({r['domain'] for r in rows if r['domain']})
print(f"Dong goc: FOFA+ZoomEye = {len(rows)}")
print(f"Duy nhat IP:PORT  = {len(by_ipport)}  -> wls-dedup-ipport.csv")
print(f"Duy nhat vhost    = {len(by_vhost)}  -> wls-dedup-vhost.csv")
print(f"Duy nhat IP       = {uniq_ip}")
print(f"Duy nhat FQDN     = {uniq_fqdn}")
