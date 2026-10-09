#!/usr/bin/env python3
"""Lọc host CHẾT khỏi wls-dedup-ipport.csv (chỉ dựa TCP liveness).
Console/T3 chỉ GHI CHÚ thêm (không dùng để loại).
Xuất wls-live.csv (chỉ host sống) + cột: version, note_console, note_t3.
Chạy: python3 filter_live.py
"""
import csv, os, re, ssl, socket, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

WORKERS = 50   # số luồng chạy song song
INFILE = sys.argv[1] if len(sys.argv) > 1 else "wls-dedup-ipport.csv"   # truyền wls-dedup-vhost.csv để quét theo vhost
OUTFILE = "wls-live-vhost.csv" if "vhost" in INFILE else "wls-live.csv"

BASE = os.path.dirname(os.path.abspath(__file__))
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
VER_RE = re.compile(r'WebLogic Server Version:\s*([0-9.]+)')
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)

def tcp_open(ip, port, timeout=4):
    try:
        s = socket.create_connection((ip, int(port)), timeout); s.close(); return True
    except Exception:
        return False

def http_get(url, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read(120000).decode("latin1", "replace")
    except urllib.error.HTTPError as e:
        try: body = e.read(120000).decode("latin1", "replace")
        except Exception: body = ""
        return e.code, {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}, body
    except Exception:
        return None, {}, ""

def console_note(scheme, host, port):
    """Ghi chú trạng thái console + version (nếu đọc được)."""
    pp = "" if port in ("80", "443") else ":" + port
    status, hdr, body = http_get(f"{scheme}://{host}{pp}/console/login/LoginForm.jsp")
    if status is None: return "", ""
    title = (TITLE_RE.search(body).group(1).strip() if TITLE_RE.search(body) else "")
    m = VER_RE.search(body); ver = m.group(1) if m else ""
    if title == "Oracle WebLogic Server Administration Console":
        return "console-open", ver
    if "WLS Administration" in title or ("Permission Denied" in body and "Console" in body):
        return "console-403", ver
    return "", ver

def t3_note(ip, port, timeout=6):
    """Bắt tay T3 trên cùng port; nếu có banner HELO:<ver> -> T3 mở + version."""
    try:
        s = socket.create_connection((ip, int(port)), timeout); s.settimeout(timeout)
        s.sendall(b"t3 12.2.1\nAS:255\nHL:19\nMS:10000000\n\n")
        data = s.recv(1024); s.close()
    except Exception:
        return "", ""
    txt = data.decode("latin1", "replace") if data else ""
    if txt.startswith("HELO") or "HELO:" in txt:
        m = re.search(r'HELO:([0-9]+(?:\.[0-9]+)+)', txt)   # không nuốt dấu chấm thừa trước 'false'
        return "T3-open", (m.group(1) if m else "")
    return "", ""

rows = []
with open(os.path.join(BASE, INFILE), newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
print(f"Input: {INFILE} ({len(rows)} dòng) -> {OUTFILE}")

def process(r):
    ip, port = r['ip'].strip(), r['port'].strip()
    if not tcp_open(ip, port):
        return ('dead', r)
    scheme = r.get('scheme') or ('https' if port in ('443','8443','7002') else 'http')
    # host để dựng request = FQDN trong URL (đúng Host header/SNI cho từng vhost); fallback domain/ip
    u = r.get('url', '')
    host = (u.split('://', 1)[-1].split('/', 1)[0].rsplit(':', 1)[0]) if u else ''
    if not host: host = r.get('domain') or ip
    cnote, cver = console_note(scheme, host, port)
    tnote, tver = t3_note(ip, port)
    r['version'] = r.get('version') or cver or tver
    r['note'] = ";".join([x for x in (cnote, tnote) if x])
    return ('live', r)

live = []; dead = 0
with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    for state, r in ex.map(process, rows):
        tag = f"{r['ip']}:{r['port']}"
        if state == 'dead':
            dead += 1; print(f"{tag:22} DEAD")
        else:
            live.append(r)
            print(f"{tag:22} LIVE  {r['note'] or '-':20} {('v'+r['version']) if r['version'] else ''}")

cols = ['url', 'ip', 'port', 'scheme', 'domain', 'version', 'note', 'title', 'city', 'org']
with open(os.path.join(BASE, OUTFILE), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore'); w.writeheader()
    for r in sorted(live, key=lambda x: (not bool(x.get('domain')), x.get('url', ''))):
        w.writerow(r)

print(f"\nTong: {len(rows)} | SONG: {len(live)} | CHET: {dead} -> {OUTFILE}")
print(f"  console-open: {sum(1 for r in live if 'console-open' in r['note'])}"
      f" | console-403: {sum(1 for r in live if 'console-403' in r['note'])}"
      f" | T3-open: {sum(1 for r in live if 'T3-open' in r['note'])}"
      f" | co version: {sum(1 for r in live if r['version'])}")
