#!/usr/bin/env python3
"""Xác minh WebLogic cho các host mới trong weblogic-new-hosts.txt.
Dùng cùng bộ dấu hiệu như trước: header X-ORACLE-DMS, cookie ADMINCONSOLESESSION,
title console, trang 404-default WebLogic, 403 WLS, hoặc proxy OHS/OAS.
Kết quả:
  - weblogic-new-confirmed.txt : host:port xác nhận/khả năng cao (append vào confirmed chính, dedup)
  - weblogic-scheme-extra.txt  : host:port <TAB> scheme (http/https) để build_xlsx bind đúng
  - weblogic-versions-all.txt  : bổ sung version nếu đọc được footerVersion
Chạy: python3 verify_new_hosts.py
"""
import os, re, ssl, json, socket, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
VER_RE = re.compile(r'WebLogic Server Version:\s*([0-9.]+)')
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)

def as_list(v):
    if isinstance(v, str): return [v] if v else []
    if isinstance(v, list): return v
    return []

# --- scheme từ WebLogicScan2.json: (ip,port) -> 'http'/'https' (ưu tiên https nếu lẫn) ---
json_scheme = {}
jp = os.path.join(BASE, "WebLogicScan2.json")
if os.path.exists(jp):
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
        for ip in as_list(o.get('ip')):
            key = (ip, port)
            if key not in json_scheme or sch == 'https':
                json_scheme[key] = sch

def port_open(ip, port, timeout=4):
    """Pre-check TCP nhanh: cổng đóng/filtered -> bỏ ngay, khỏi chờ HTTP timeout 12s."""
    p = int(port) if port else 443
    try:
        s = socket.create_connection((ip, p), timeout); s.close(); return True
    except Exception:
        return False

def fetch(url, timeout=8):
    """Trả (status, headers_dict_lower, body). Bắt cả HTTPError để đọc header/body lỗi."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        body = r.read(200000).decode("latin1", "replace")
        hdr = {k.lower(): v for k, v in r.headers.items()}
        return r.status, hdr, body
    except urllib.error.HTTPError as e:
        try: body = e.read(200000).decode("latin1", "replace")
        except Exception: body = ""
        hdr = {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}
        return e.code, hdr, body
    except Exception:
        return None, {}, ""

def classify(status, hdr, body):
    """Trả (verdict, version). verdict: 'confirmed' | 'likely' | ''.
    Bao các trường hợp: 200 console, 403 WLS/Permission Denied, 404-default WebLogic,
    và 302/303 (urllib tự follow -> body/headers là của ĐÍCH cuối nên vẫn bắt được)."""
    title = (TITLE_RE.search(body).group(1).strip() if TITLE_RE.search(body) else "")
    server = hdr.get("server", "")
    cookie = hdr.get("set-cookie", "")
    ver = VER_RE.search(body); ver = ver.group(1) if ver else ""
    # dấu hiệu WebLogic chắc chắn (độc lập status code)
    if ("x-oracle-dms-ecid" in hdr or "x-oracle-dms-rid" in hdr          # header DMS
            or "ADMINCONSOLESESSION" in cookie                            # cookie console
            or title == "Oracle WebLogic Server Administration Console"   # 200 console
            or "WLS Administration" in title                              # 403 WLS
            or "Permission Denied" in body and "Console" in body          # 403 kiểu khác
            or ("Error 404--Not Found" in body and "RFC 2068" in body)):  # 404-default WebLogic
        return "confirmed", ver
    # proxy Oracle đứng trước -> khả năng cao
    if re.search(r"Oracle-HTTP-Server|Oracle-Application-Server", server, re.I):
        return "likely", ver
    return "", ver

def probe(ip, port):
    # pre-check TCP: cổng không mở -> bỏ ngay
    chk_port = port if port else "443"
    if not port_open(ip, chk_port) and not (port == "" and port_open(ip, "80")):
        return ("", "", "")
    # LUÔN thử cả http lẫn https (pre-check TCP đã loại cổng chết nên không chậm);
    # chỉ dùng scheme JSON / port để xếp THỨ TỰ ưu tiên probe trước
    js = json_scheme.get((ip, port))
    if js == "https" or port in ("443", "8443", "7002"):
        order = ["https", "http"]
    elif js == "http":
        order = ["http", "https"]
    else:
        order = ["http", "https"]
    best = ("", "", "")   # verdict, version, scheme
    for sch in order:
        pp = "" if port in ("", "80", "443") else ":" + port
        # urllib.urlopen tự đi theo 301/302/303 -> status/hdr/body là của đích cuối
        status, hdr, body = fetch(f"{sch}://{ip}{pp}/console/login/LoginForm.jsp")
        if status is None:
            continue
        verdict, ver = classify(status, hdr, body)
        if verdict == "confirmed":
            return verdict, ver, sch
        if verdict == "likely" and best[0] != "confirmed":
            best = (verdict, ver, sch)
    return best

hosts = [l.strip() for l in open(os.path.join(BASE, "weblogic-new-hosts.txt")) if l.strip()]
confirmed = []; schemes = {}; versions = {}
for hp in hosts:
    ip, port = (hp.rsplit(":", 1) if ":" in hp else (hp, ""))
    verdict, ver, sch = probe(ip, port)
    tag = {"confirmed": "WebLogic", "likely": "likely(OHS/OAS)"}.get(verdict, "-")
    print(f"{hp:28} -> {tag:16} {('v'+ver) if ver else ''} {('['+sch+']') if sch else ''}")
    if verdict in ("confirmed", "likely"):
        confirmed.append(hp)
        if sch: schemes[hp] = sch
        if ver: versions[hp] = ver

# ghi weblogic-new-confirmed.txt
with open(os.path.join(BASE, "weblogic-new-confirmed.txt"), "w") as f:
    for hp in confirmed: f.write(hp + "\n")

# append scheme-extra (dedup theo host:port)
sp = os.path.join(BASE, "weblogic-scheme-extra.txt"); existing = {}
if os.path.exists(sp):
    for line in open(sp):
        if "\t" in line:
            k, v = line.strip().split("\t", 1); existing[k] = v
existing.update(schemes)
with open(sp, "w") as f:
    for k, v in existing.items(): f.write(f"{k}\t{v}\n")

# append versions vào weblogic-versions-all.txt (dedup)
vp = os.path.join(BASE, "weblogic-versions-all.txt"); vex = {}
if os.path.exists(vp):
    for line in open(vp):
        parts = line.strip().split("\t") if "\t" in line else line.split()
        if len(parts) >= 2: vex[parts[0]] = parts[-1]
vex.update(versions)
with open(vp, "w") as f:
    for k, v in vex.items(): f.write(f"{k}\t{v}\n")

# merge vào confirmed chính (dedup)
cp = os.path.join(BASE, "weblogic-confirmed-hostport.txt")
cur = set(l.strip() for l in open(cp) if l.strip()) if os.path.exists(cp) else set()
merged = sorted(cur | set(confirmed))
with open(cp, "w") as f:
    for h in merged: f.write(h + "\n")

print(f"\nXac nhan WebLogic trong 85 host moi: {len(confirmed)}")
print(f"  -> them vao weblogic-confirmed-hostport.txt (tong gio: {len(merged)})")
print(f"  -> version moi doc duoc: {len(versions)}")
