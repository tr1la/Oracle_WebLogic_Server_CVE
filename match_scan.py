#!/usr/bin/env python3
"""
match_scan.py — match the URLs/IPs in each row of Weblogic-VN-live-final.xlsx
against the records in WebLogicScan2.json, which mixes TWO sources with different
schemas:

  * Fofa    (flat): ip, port, protocol, host, domain, link, title, org, country, city
  * ZoomEye (rich): protocol_*, product, version, service, os, ssl, asn, isp,
                    organization, city_name_EN, http_title, webapp_*, server_*,
                    waf_*, component_*, db_*, framework, ... (+ CN/EN geo fields)

Each source is detected per record, both are merged per IP (so an IP can match a
Fofa AND a ZoomEye record), and their fields are normalised into one common set
plus the high-value ZoomEye-only extras. Matching is by IP, preferring exact
IP:port; IP-only matches are reported too (with the other ports that IP exposes).

Usage:
  python3 match_scan.py [--xlsx Weblogic-VN-live-final.xlsx]
                        [--json WebLogicScan2.json]
                        [--out matches.csv]   # one CSV row per (sheet-row, source)
"""
import argparse, ast, csv, json, re

_EMPTY = {"", "none", "null", "[]", "[none]", "['']", '[""]', "nan", "{}", "-"}


def clean(v):
    """Drop junk placeholders ('None', '[]', ...) and unwrap Python-list-repr
    strings like "['index', 'Error']" into "index, Error" (deduped)."""
    if v is None:
        return ""
    s = str(v).strip()
    if s.lower() in _EMPTY:
        return ""
    if s.startswith("[") and s.endswith("]"):
        try:
            parts = ast.literal_eval(s)
            if isinstance(parts, (list, tuple)):
                parts = [str(p).strip() for p in parts
                         if str(p).strip() and str(p).strip().lower() != "none"]
                s = ", ".join(dict.fromkeys(parts))
        except (ValueError, SyntaxError):
            pass
    # collapse newlines/whitespace so multi-line blobs (e.g. ssl certs) stay 1 line
    return re.sub(r"\s+", " ", s).strip()


def trunc(s, n):
    return s if len(s) <= n else s[:n - 1] + "…"


def joinv(*parts):
    out = [clean(p) for p in parts]
    return " ".join(p for p in out if p)


def load_scan(path):
    """Parse the scan file robustly: mostly NDJSON but with stray \\r and a few
    concatenated objects, so decode objects with raw_decode, not line by line."""
    data = open(path, encoding="utf-8", errors="replace").read()
    dec = json.JSONDecoder()
    i, n, recs = 0, len(data), []
    while i < n:
        while i < n and data[i] in " \t\r\n,":
            i += 1
        if i >= n:
            break
        try:
            obj, j = dec.raw_decode(data, i)
            recs.append(obj)
            i = j
        except json.JSONDecodeError:
            nxt = data.find("{", i + 1)
            if nxt < 0:
                break
            i = nxt
    return recs


def source_of(rec):
    if any(k in rec for k in ("city_name_EN", "asn", "protocol_transport", "organization")):
        return "zoomeye"
    if any(k in rec for k in ("host", "link", "domain")):
        return "fofa"
    return "other"


# Common (both sources map into these) + ZoomEye-only high-value extras.
COMMON = ["domain", "title", "org", "city", "country", "protocol", "host"]
ZEXTRA = ["product", "version", "service", "os", "device", "ssl", "asn", "isp",
          "server", "webapp", "component", "db", "waf", "framework",
          "keywords", "http_title"]
ALLCOLS = COMMON + ZEXTRA
# Fields that count as "informative" (reveal something not already in the sheet).
INFORMATIVE = ["domain", "title", "http_title"] + ZEXTRA


def normalize(rec, src):
    g = lambda k: clean(rec.get(k, ""))
    d = {k: "" for k in ALLCOLS}
    if src == "fofa":
        d.update(domain=g("domain"), title=g("title"), org=g("org"),
                 city=g("city"), country=g("country"),
                 protocol=g("protocol"), host=g("host") or g("link"))
    elif src == "zoomeye":
        d.update(
            domain=g("domains") or g("hostname") or g("rdns"),
            title=g("title") or g("http_title"),
            org=g("organization") or g("organization_CN"),
            city=g("city_name_EN"),
            country=g("country_name_EN") or g("country_code"),
            protocol=g("protocol_application"),
            host=g("url") or g("site") or g("hostname"),
            product=g("product"), version=g("version"), service=g("service"),
            os=g("os"), device=g("device"), ssl=g("ssl"),
            asn=g("asn"), isp=g("isp"),
            server=joinv(rec.get("server_name"), rec.get("server_version")),
            webapp=joinv(rec.get("webapp_name"), rec.get("webapp_version")),
            component=joinv(rec.get("component_name"), rec.get("component_version")),
            db=joinv(rec.get("db_name"), rec.get("db_version")),
            waf=joinv(rec.get("waf_name"), rec.get("waf_version")),
            framework=g("framework"), keywords=g("keywords"), http_title=g("http_title"),
        )
    return d


IP_RE = re.compile(r"\b(\d{1,3}(?:\.\d{1,3}){3})\b")


def host_port_from_url(url):
    m = re.match(r"^\s*(https?)://([^/:\s]+)(?::(\d+))?", str(url).strip(), re.I)
    if not m:
        return None
    scheme, port = m.group(1).lower(), m.group(3)
    return port or ("443" if scheme == "https" else "80")


def ip_from(url, ipport_cell):
    for src in (ipport_cell, url):
        if src:
            m = IP_RE.search(str(src))
            if m:
                return m.group(1)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", default="Weblogic-VN-live-final.xlsx")
    ap.add_argument("--json", default="WebLogicScan2.json")
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    import openpyxl

    recs = load_scan(args.json)
    by_ip = {}
    src_count = {"fofa": 0, "zoomeye": 0, "other": 0}
    for r in recs:
        if not isinstance(r, dict):
            continue
        src = source_of(r)
        src_count[src] += 1
        r["_src"] = src
        ip = str(r.get("ip", "")).strip()
        if ip:
            by_ip.setdefault(ip, []).append(r)
    print(f"[*] scan JSON: {len(recs)} records "
          f"(fofa={src_count['fofa']}, zoomeye={src_count['zoomeye']}, "
          f"other={src_count['other']}), {len(by_ip)} unique IPs")

    wb = openpyxl.load_workbook(args.xlsx, read_only=True)
    ws = wb.active
    rows = [(r, str(ws.cell(r, 1).value).strip(), ws.cell(r, 2).value)
            for r in range(2, ws.max_row + 1)
            if ws.cell(r, 1).value and str(ws.cell(r, 1).value).strip()]
    wb.close()
    print(f"[*] Excel: {len(rows)} rows with a URL\n")

    out_rows, unmatched = [], []
    matched = n_fofa = n_zoom = n_both = n_info = 0

    for row, url, ipport in rows:
        port = host_port_from_url(url)
        ip = ip_from(url, ipport)
        cands = by_ip.get(ip, []) if ip else []
        if not cands:
            unmatched.append((row, url, ip or "?"))
            continue
        exact = [r for r in cands if str(r.get("port", "")).strip() == str(port)]
        how = "ip:port" if exact else "ip-only"
        use = exact or cands
        # dedupe by (source, port)
        seen, picked = set(), []
        for r in use:
            key = (r["_src"], str(r.get("port", "")).strip())
            if key not in seen:
                seen.add(key)
                picked.append(r)
        other_ports = sorted({str(r.get("port", "")).strip() for r in cands} - {str(port)})

        matched += 1
        srcs = {r["_src"] for r in picked}
        if "fofa" in srcs:
            n_fofa += 1
        if "zoomeye" in srcs:
            n_zoom += 1
        if {"fofa", "zoomeye"} <= srcs:
            n_both += 1

        row_has_info = False
        print(f"row {row:>3}  {url}   [{how}: ip={ip}"
              + (f"; IP also on ports {', '.join(other_ports)}" if how == "ip-only" and other_ports else "")
              + "]")
        for r in picked:
            src = r["_src"]
            nd = normalize(r, src)
            info = any(nd[k] for k in INFORMATIVE)
            row_has_info = row_has_info or info
            rport = str(r.get("port", "")).strip()
            print(f"    [{src}] port={rport}")
            for k in ALLCOLS:
                if nd[k]:
                    mark = "  <-- NEW" if k in INFORMATIVE else ""
                    print(f"        {k:<10}= {trunc(nd[k], 100)}{mark}")
            out_rows.append({"row": row, "url": url, "ip": ip, "port": rport,
                             "match": how, "source": src,
                             **{k: trunc(nd[k], 300) for k in ALLCOLS},
                             "ip_other_ports": ";".join(other_ports)})
        if row_has_info:
            n_info += 1
        print()

    print(f"[=] {matched}/{len(rows)} rows matched a scan record "
          f"(fofa={n_fofa}, zoomeye={n_zoom}, both={n_both}); "
          f"{n_info} reveal extra info beyond the sheet.")
    print(f"[=] {len(unmatched)} rows had no IP match in the scan JSON:")
    for row, url, ip in unmatched:
        print(f"      row {row:>3}  {url}  (ip={ip})")

    if args.out:
        cols = ["row", "url", "ip", "port", "match", "source"] + ALLCOLS + ["ip_other_ports"]
        with open(args.out, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerows(out_rows)
        print(f"\n[=] wrote {len(out_rows)} matched (row x source) records -> {args.out}")


if __name__ == "__main__":
    main()
