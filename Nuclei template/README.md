# Nuclei Templates — Oracle WebLogic Server CVEs (2020–2026)

Templates for the WebLogic CVEs in [`../oracle-weblogic-analysis-poc-2020-2026.md`](../oracle-weblogic-analysis-poc-2020-2026.md)
that did **not** already reference a public Nuclei template. For the 5 CVEs that
already ship an official template, no file was written here — use the upstream
one (links in the table below).

## 1. Detection methodology (read this first)

Most WebLogic CVEs here are **T3/IIOP unsafe-deserialization or JNDI-injection
RCE**. A true exploit requires sending a Java serialized gadget / JNDI payload
over a binary protocol — this cannot be expressed safely or reliably in a YAML
template, and running it against live hosts is destructive. So these templates
use the standard non-destructive approach:

- **T3 version-fingerprint (`*.yaml`, protocol `tcp`):** probe T3 (7001) and
  T3S (7002), confirm WebLogic via the `HELO` handshake, extract the reported
  version, and flag hosts whose **base version** is within the affected range
  for that CVE.
  - ⚠️ The T3 handshake reveals only the **base release**, not the applied
    Critical Patch Update. A match = **potential exposure**, not confirmed
    vulnerability. Always confirm the host's patch level.
- **HTTP active/heuristic:** `CVE-2021-2109` (console attack-surface + version)
  and `CVE-2026-21962` (proxy-plugin normalization bypass — heuristic because
  the upstream PoC is redacted).

For **confirmed exploitation** of the two where an official active (OAST-based)
template exists, prefer upstream:
- `CVE-2023-21839` → `nuclei-templates/javascript/cves/2023/CVE-2023-21839.yaml`
- `CVE-2021-2135` → `nuclei-templates/http/cves/2021/CVE-2021-2135.yaml`

## 2. Active OAST template — CVE-2024-20931 (lab-verified)

`CVE-2024-20931-active-oast.yaml` is a **real exploit** template (nuclei
`javascript:` protocol), not version detection. It was **verified against a live
WebLogic 12.2.1.4.0 lab** — nuclei reported `[CVE-2024-20931] [javascript]
[critical]` via an interactsh **DNS callback**.

How it was built (reproducible method for the other T3/IIOP JNDI CVEs):

1. **Capture** the real T3 `rebind`+`lookup` byte stream by running the public
   PoC (`GlassyAmadeus/CVE-2024-20931`) against the lab under an `LD_PRELOAD`
   `read`/`write` shim (`sockdump.c`). A transparent TCP proxy does **not** work
   — WebLogic's RJVM handshake validates peer addresses — and the container had
   no `strace`/`tcpdump` (`NET_RAW` dropped), so the in-process `LD_PRELOAD`
   shim (needs only `gcc`) was the enabler.
2. **Replay** that stream in the template, substituting the attacker JNDI host
   with `{{interactsh-url}}` using a **fixed 96-byte-wide** marker, so every T3
   and Java-serialization length field stays valid with zero length math.
3. Two nuclei-specific details that matter:
   - the exploit is **stateful but fire-and-forget**, so the whole stream is
     replayed on one socket; and
   - the template must **hold the connection open** after sending (`RecvFull`)
     so the server completes the lookup→callback before `Close()` — otherwise
     nuclei closes too early and nothing fires.

**Signing:** nuclei refuses unsigned `javascript:` templates. Sign once with your
own key:

```bash
nuclei -sign -t "Nuclei template/CVE-2024-20931-active-oast.yaml"
nuclei -t "Nuclei template/CVE-2024-20931-active-oast.yaml" -u target:7001
```

**Version coverage:** verified on **both WebLogic 12.2.1.4.0 and 14.1.1.0.0**
with the identical byte stream (one `javascript:` template, no version branching).

Why it is version-independent despite being a byte-replay: the only
version-sensitive bytes in a Java serialization stream are typically the class
descriptor's `serialVersionUID` and field layout. Decompiling
`weblogic.deployment.jms.ForeignOpaqueReference` from `weblogic.jar` shows UID is
a **declared constant** (`4404892619941441265L` = `0x3d21527fed596ef1`), and that
exact value is what we captured on the wire — Oracle hard-codes it so Foreign
JMS Server configurations serialize compatibly across versions. The server
re-uses its own class definition on deserialize, so field layout differences are
tolerated when UIDs match.

If future WebLogic releases ever change this UID, add a `HELO`-based branch
(the T3 handshake reports the server version precisely); the replay captures
needed for other versions take minutes with the `sockdump.c` + Python replay
pipeline documented in `PoC-active-lab-verified/`.

## 3. Coverage map

| CVE | Vuln type | Template status | File / source | Detection type |
|-----|-----------|-----------------|---------------|----------------|
| CVE-2020-2551  | IIOP deser RCE            | **created** | `CVE-2020-2551.yaml`  | T3 version |
| CVE-2020-2555  | Coherence T3 deser RCE    | **created** | `CVE-2020-2555.yaml`  | T3 version |
| CVE-2020-2883  | T3/IIOP deser RCE         | **created** | `CVE-2020-2883.yaml`  | T3 version |
| CVE-2020-14644 | T3/IIOP class-load RCE    | **created** | `CVE-2020-14644.yaml` | T3 version |
| CVE-2020-14645 | T3/IIOP JNDI deser RCE    | **created** | `CVE-2020-14645.yaml` | T3 version |
| CVE-2020-14825 | Coherence T3/IIOP RCE     | **created** | `CVE-2020-14825.yaml` | T3 version |
| CVE-2020-14841 | IIOP JNDI deser RCE       | **created** | `CVE-2020-14841.yaml` | T3 version |
| CVE-2020-14756 | Coherence T3/IIOP RCE     | **created** | `CVE-2020-14756.yaml` | T3 version |
| CVE-2020-14882 | Console auth bypass       | _upstream_  | `http/cves/2020/CVE-2020-14882.yaml` | active HTTP |
| CVE-2020-14883 | Console code injection    | _upstream_  | `http/cves/2020/CVE-2020-14883.yaml` | active HTTP |
| CVE-2020-14750 | Console auth bypass       | _upstream_  | `http/cves/2020/CVE-2020-14750.yaml` | active HTTP |
| CVE-2021-2109  | Console JNDI (auth) RCE   | **created** | `CVE-2021-2109.yaml`  | HTTP console + version |
| CVE-2021-2135  | T3/IIOP deser RCE         | _upstream_  | `http/cves/2021/CVE-2021-2135.yaml` | active OAST |
| CVE-2021-2136  | IIOP 2nd-order deser RCE  | **created** | `CVE-2021-2136.yaml`  | T3 version |
| CVE-2021-2211  | T3/IIOP XXE info leak     | **created** | `CVE-2021-2211.yaml`  | T3 version |
| CVE-2021-2394  | T3/IIOP deser RCE         | **created** | `CVE-2021-2394.yaml`  | T3 version |
| CVE-2022-21371 | LFI / path traversal      | _upstream_  | `http/cves/2022/CVE-2022-21371.yaml` | active HTTP |
| CVE-2023-21839 | T3/IIOP JNDI RCE          | **created** (+ upstream active) | `CVE-2023-21839.yaml` | T3 version |
| CVE-2023-21931 | T3 deser/JNDI             | **created** | `CVE-2023-21931.yaml` | T3 version |
| CVE-2024-20931 | T3/IIOP JNDI RCE          | **created — LAB-VERIFIED active** | `CVE-2024-20931-active-oast.yaml` (active, signed) + `CVE-2024-20931.yaml` (version) | **active OAST** |
| CVE-2024-21006 | T3/IIOP double-JNDI RCE   | **created** | `CVE-2024-21006.yaml` | T3 version |
| CVE-2024-21182 | T3/IIOP JNDI RCE (KEV)    | **created** | `CVE-2024-21182.yaml` | T3 version |
| CVE-2026-21962 | Proxy-plugin traversal    | **created** | `CVE-2026-21962.yaml` | heuristic HTTP |
| CVE-2026-60206 | SAML auth bypass          | **created** | `CVE-2026-60206.yaml` | T3 version |

**19 templates created**; 5 already covered upstream.

## 4. Usage

Validate the templates:

```bash
nuclei -validate -t "Nuclei template/"
```

Run a single CVE against a target (include the T3 port):

```bash
nuclei -t "Nuclei template/CVE-2023-21839.yaml" -u target:7001
```

Run the whole folder against a list:

```bash
nuclei -t "Nuclei template/" -l targets.txt
```

The HTTP heuristic (`CVE-2026-21962`) benefits from interactsh/OAST and a known
protected path — adjust `path`/matchers once the authoritative PoC is public.

## 5. Caveats & disclaimer

- T3 templates report **base-version exposure**, which can be a false positive on
  fully patched hosts (same base version, patched internals). Confirm CPU level.
- `CVE-2026-21962` is a **heuristic** (PoC redacted upstream) and
  `CVE-2026-60206` relies on T3 version only (public SAML PoCs are unverified —
  one uses a `placeholder_signature`).
- Use only against systems you are authorized to test.
