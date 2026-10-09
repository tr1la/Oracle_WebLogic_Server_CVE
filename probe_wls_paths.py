#!/usr/bin/env python3
"""Probe các path đặc trưng WebLogic (qua OHS/proxy) để xác nhận backend là WebLogic.
CHỈ phát hiện (GET không payload) — không khai thác.

Batch (mặc định): python3 probe_wls_paths.py [input.csv/txt]
    đọc file host (mặc định weblogic-confirmed-hostport.txt), ghi weblogic-wls-paths-report.txt
Single target:    python3 probe_wls_paths.py <host:port | ip | http(s)://host:port>
    probe 1 target, in chi tiết từng path ra màn hình (không ghi file)
"""
import os, re, ssl, json, socket, sys, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

# path WebLogic-riêng: OHS sẽ route xuống backend WebLogic nếu có
WLS_PATHS = [
    "/console/login/LoginForm.jsp",
    "/bea_wls_internal/",
    "/uddiexplorer/",
    "/wls-wsat/CoordinatorPortType",
    "/_async/AsyncResponseService",
    "/wls-cat/",
]
VER_RE = re.compile(r'WebLogic Server Version:\s*([0-9.]+)')
# dấu hiệu backend WebLogic trong body/headers/cookie
BODY_SIG = re.compile(r'WebLogic|wls-wsat|CoordinatorPortType|AsyncResponseService|'
                      r'Error 404--Not Found|uddiexplorer|BEA Systems|Web Services', re.I)

# scheme từ JSON
json_scheme = {}
for jf in ("WebLogicScan2.json", "WeblogicScan.json"):
    jp = os.path.join(BASE, jf)
    if not os.path.exists(jp): continue
    for line in open(jp):
        line = line.strip()
        if not line: continue
        try: o = json.loads(line)
        except Exception: continue
        port = str(o.get('port') or '')
        sch = (o.get('service') or o.get('protocol') or '').strip().lower()
        if sch not in ('http', 'https'):
            u = (o.get('url') or o.get('link') or '')
            sch = u.split('://', 1)[0].lower() if '://' in u else ''
        if sch not in ('http', 'https'): continue
        ipv = o.get('ip')
        ips = [ipv] if isinstance(ipv, str) else (ipv if isinstance(ipv, list) else [])
        for ip in ips:
            k = (ip, port)
            if k not in json_scheme or sch == 'https': json_scheme[k] = sch

def port_open(ip, port, timeout=4):
    try:
        s = socket.create_connection((ip, int(port) if port else 443), timeout); s.close(); return True
    except Exception:
        return False

def fetch(url, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read(100000).decode("latin1", "replace")
    except urllib.error.HTTPError as e:
        try: body = e.read(100000).decode("latin1", "replace")
        except Exception: body = ""
        return e.code, {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}, body
    except Exception:
        return None, {}, ""

def wls_backend(status, hdr, body):
    """True nếu response mang dấu hiệu backend WebLogic."""
    cookie = hdr.get("set-cookie", "")
    if "x-oracle-dms-ecid" in hdr or "x-oracle-dms-rid" in hdr: return True
    if re.search(r'JSESSIONID=[^;]*!', cookie) or "ADMINCONSOLESESSION" in cookie: return True
    if BODY_SIG.search(body): return True
    return False

def scheme_for(ip, port, forced=""):
    if forced: return forced
    js = json_scheme.get((ip, port))
    if js: return js
    return "https" if port in ("443", "8443", "7002") else "http"

def parse_target(t):
    """'host:port' | 'ip' | 'http(s)://host:port[/path]' -> (host, port, scheme_forced)."""
    t = t.strip(); forced = ""
    if "://" in t:
        forced = t.split("://", 1)[0].lower()
        t = t.split("://", 1)[1].split("/", 1)[0]
    if ":" in t and t.rsplit(":", 1)[1].isdigit():
        host, port = t.rsplit(":", 1)
    else:
        host, port = t, ("443" if forced == "https" else "")
    return host, port, forced

def probe_host(host, port, forced="", verbose=False):
    """Trả (verdict, ver, hits). verbose=True -> in chi tiết từng path."""
    if not port_open(host, port):
        if verbose: print(f"  [DEAD] không mở được {host}:{port or '80/443'}")
        return "DEAD", "", []
    sch = scheme_for(host, port, forced)
    pp = "" if port in ("", "80", "443") else ":" + port
    hits = []; ver = ""
    for path in WLS_PATHS:
        status, hdr, body = fetch(f"{sch}://{host}{pp}{path}")
        if status is None:
            if verbose: print(f"  {path:40} -> (no response)")
            continue
        m = VER_RE.search(body)
        if m and not ver: ver = m.group(1)
        is_wls = wls_backend(status, hdr, body)
        if is_wls: hits.append(f"{path}({status})")
        if verbose:
            tag = "WLS" if is_wls else "-"
            vtag = (" v" + m.group(1)) if m else ""
            print(f"  {path:40} -> [{status}] {tag}{vtag}")
    return ("WLS-backend" if hits else "no-WLS-path"), ver, hits

arg = sys.argv[1] if len(sys.argv) > 1 else ""

# --- Single target: arg có nhưng KHÔNG phải file trên đĩa ---
if arg and not os.path.exists(arg):
    host, port, forced = parse_target(arg)
    sch = scheme_for(host, port, forced)
    print(f"Target: {sch}://{host}{(':'+port) if port and port not in ('80','443') else ''}")
    verdict, ver, hits = probe_host(host, port, forced, verbose=True)
    print(f"\n=> {verdict}" + (f" | version: {ver}" if ver else "") +
          (f" | hits: {', '.join(hits)}" if hits else ""))
    sys.exit(0)

# --- Batch: đọc file (mặc định confirmed) ---
INFILE = arg if arg else "weblogic-confirmed-hostport.txt"
hosts = [l.strip() for l in open(os.path.join(BASE, INFILE)) if l.strip()]
report = []
for hp in hosts:
    ip, port = (hp.rsplit(":", 1) if ":" in hp else (hp, ""))
    verdict, ver, hits = probe_host(ip, port)
    report.append((hp, verdict, ver, hits))
    print(f"{hp:28} {verdict:14} {('v'+ver) if ver else '':12} {' '.join(hits)}")

with open(os.path.join(BASE, "weblogic-wls-paths-report.txt"), "w") as f:
    for hp, verdict, ver, hits in report:
        f.write(f"{hp}\t{verdict}\t{ver}\t{';'.join(hits)}\n")

nwls = sum(1 for _, v, _, _ in report if v == "WLS-backend")
nver = sum(1 for _, _, vr, _ in report if vr)
print(f"\nWLS-backend xac nhan qua path: {nwls}/{len(hosts)} | version doc them: {nver}")
print("-> weblogic-wls-paths-report.txt")
