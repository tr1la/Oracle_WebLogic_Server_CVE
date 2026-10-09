#!/usr/bin/env python3
"""Gộp cặp URL chỉ khác scheme (http vs https, cùng host[:port]/path) NGAY TRÊN file xlsx:
giữ bản https, bỏ bản http (merge Version/Note sang https trước khi bỏ).
Giữ nguyên mọi dòng khác, style, hyperlink, và các chỉnh sửa tay của bạn.

Chạy:
  python3 dedup_scheme_xlsx.py [input.xlsx] [output.xlsx]
Mặc định: input = WLS-VN-live-vhost.xlsx, output = <input>-https.xlsx
"""
import os, sys
from openpyxl import load_workbook

BASE = os.path.dirname(os.path.abspath(__file__))
inp = sys.argv[1] if len(sys.argv) > 1 else "WLS-VN-live-vhost.xlsx"
if len(sys.argv) > 2:
    out = sys.argv[2]
else:
    stem, ext = os.path.splitext(inp)
    out = f"{stem}-https{ext or '.xlsx'}"

wb = load_workbook(os.path.join(BASE, inp))
ws = wb.active

# map tên cột -> chỉ số (theo hàng tiêu đề)
hdr = {str(c.value).strip().lower(): c.column for c in ws[1] if c.value}
col_url = hdr.get("url", 1)
col_ver = hdr.get("version")
col_note = hdr.get("note")

def cell(row, col):
    return ws.cell(row=row, column=col)

def url_at(row):
    v = cell(row, col_url).value
    return (v or "") if isinstance(v, str) else (v.hyperlink.target if False else str(v or ""))

def ident(u):
    return u.split("://", 1)[-1] if "://" in u else u

last = ws.max_row
# 1) lập map ident -> hàng https
https_row = {}
for r in range(2, last + 1):
    u = url_at(r)
    if u.startswith("https://"):
        https_row[ident(u)] = r

# 2) tìm hàng http trùng, merge version/note sang https, đánh dấu xoá
to_delete = []
for r in range(2, last + 1):
    u = url_at(r)
    if u.startswith("http://") and ident(u) in https_row:
        hr = https_row[ident(u)]
        if col_ver:
            if not cell(hr, col_ver).value and cell(r, col_ver).value:
                cell(hr, col_ver).value = cell(r, col_ver).value
        if col_note:
            if not cell(hr, col_note).value and cell(r, col_note).value:
                cell(hr, col_note).value = cell(r, col_note).value
        to_delete.append(r)

# 3) xoá từ dưới lên để không lệch chỉ số
for r in sorted(to_delete, reverse=True):
    ws.delete_rows(r, 1)

# cập nhật vùng auto_filter nếu có
try:
    ws.auto_filter.ref = f"A1:{ws.cell(row=1, column=ws.max_column).coordinate[:-1]}{ws.max_row}"
except Exception:
    pass

wb.save(os.path.join(BASE, out))
print(f"Input:  {inp} ({last-1} dòng dữ liệu)")
print(f"Bỏ {len(to_delete)} dòng http trùng https (đã merge Version/Note).")
print(f"Output: {out} ({ws.max_row-1} dòng)")
