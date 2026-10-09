#!/usr/bin/env python3
"""Dedup trên xlsx: bỏ URL THUẦN IP (host không có chữ) khi IP:PORT đó ĐÃ có URL domain.
Lý do: URL domain và URL IP cùng IP:PORT là cùng một endpoint -> giữ bản domain (có hostname),
merge Version/Note từ dòng IP sang dòng domain trước khi bỏ.
Giữ nguyên các dòng khác, style, hyperlink, chỉnh sửa tay.

Chạy: python3 dedup_ip_xlsx.py [input.xlsx] [output.xlsx]
Mặc định output = <input>-noip.xlsx (KHÔNG ghi đè input)
"""
import os, sys
from openpyxl import load_workbook

BASE = os.path.dirname(os.path.abspath(__file__))
inp = sys.argv[1] if len(sys.argv) > 1 else "WLS-VN-live-vhost(AutoRecovered).xlsx"
if len(sys.argv) > 2:
    out = sys.argv[2]
else:
    stem, ext = os.path.splitext(inp)
    out = f"{stem}-noip{ext or '.xlsx'}"

wb = load_workbook(os.path.join(BASE, inp))
ws = wb.active
hdr = {str(c.value).strip().lower(): c.column for c in ws[1] if c.value}
col_url = hdr.get("url", 1)
col_ipport = hdr.get("ip:port", 2)
col_ver = hdr.get("version")
col_note = hdr.get("note")

def cv(row, col):
    return ws.cell(row=row, column=col).value

def host_of(u):
    u = str(u or "")
    return u.split("://", 1)[-1].split("/", 1)[0].rsplit(":", 1)[0]

def has_letter(u):
    return any(c.isalpha() for c in host_of(u))

last = ws.max_row
# IP:PORT nào có URL domain -> giữ, và nhớ dòng domain đầu tiên để merge
domain_ipport_row = {}
for r in range(2, last + 1):
    if has_letter(cv(r, col_url)):
        key = str(cv(r, col_ipport) or "").strip()
        domain_ipport_row.setdefault(key, r)

# dòng thuần IP mà IP:PORT đã có domain -> merge ver/note rồi xoá
to_delete = []
for r in range(2, last + 1):
    u = cv(r, col_url)
    if has_letter(u):
        continue   # dòng domain, giữ
    key = str(cv(r, col_ipport) or "").strip()
    if key in domain_ipport_row:
        dr = domain_ipport_row[key]
        if col_ver and not cv(dr, col_ver) and cv(r, col_ver):
            ws.cell(row=dr, column=col_ver).value = cv(r, col_ver)
        if col_note and not cv(dr, col_note) and cv(r, col_note):
            ws.cell(row=dr, column=col_note).value = cv(r, col_note)
        to_delete.append(r)

for r in sorted(to_delete, reverse=True):
    ws.delete_rows(r, 1)

try:
    ws.auto_filter.ref = f"A1:{ws.cell(row=1, column=ws.max_column).coordinate[:-1]}{ws.max_row}"
except Exception:
    pass

wb.save(os.path.join(BASE, out))
print(f"Input:  {inp} ({last-1} dòng)")
print(f"Bỏ {len(to_delete)} URL thuần-IP trùng IP:PORT với URL domain (đã merge Version/Note).")
print(f"Output: {out} ({ws.max_row-1} dòng)")
