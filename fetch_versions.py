#!/usr/bin/env python3
"""Thử lấy WebLogic footerVersion cho toàn bộ host trong weblogic-confirmed-hostport.txt.
Ghi ra weblogic-versions-all.txt (dòng: host:port <TAB> version) để build_xlsx.py nạp.
Chạy: python3 fetch_versions.py
"""
import os, re, ssl, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
VER_RE = re.compile(r'WebLogic Server Version:\s*([0-9.]+)')
PATHS = ["/console/login/LoginForm.jsp", "/console/"]

def fetch(url, timeout=12):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return r.read(200000).decode("latin1", "replace")
    except Exception as e:
        # vài trang trả lỗi HTTP nhưng vẫn có body chứa version
        body = getattr(e, "read", None)
        if body:
            try: return e.read(200000).decode("latin1", "replace")
            except Exception: return ""
        return ""

def version_for(ip, port):
    # thứ tự scheme ưu tiên theo port
    schemes = (["https", "http"] if port in ("443", "8443", "7002", "")
               else ["http", "https"])
    for sch in schemes:
        pp = "" if port in ("", "80", "443") else ":" + port
        for path in PATHS:
            html = fetch(f"{sch}://{ip}{pp}{path}")
            m = VER_RE.search(html)
            if m:
                return m.group(1)
    return ""

rows = []
with open(os.path.join(BASE, "weblogic-confirmed-hostport.txt")) as f:
    hosts = [l.strip() for l in f if l.strip()]

out = []
for hp in hosts:
    ip, port = (hp.rsplit(":", 1) if ":" in hp else (hp, ""))
    v = version_for(ip, port)
    out.append((hp, v))
    print(f"{hp:30} -> {v or '-'}")

with open(os.path.join(BASE, "weblogic-versions-all.txt"), "w") as f:
    for hp, v in out:
        if v:
            f.write(f"{hp}\t{v}\n")

got = sum(1 for _, v in out if v)
print(f"\nLay duoc version: {got}/{len(out)} host -> weblogic-versions-all.txt")
