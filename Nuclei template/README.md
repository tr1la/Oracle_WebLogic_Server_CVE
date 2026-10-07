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
- **HTTP active/heuristic:** `CVE-2021-2109` (console attack-surface + version).

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

### 2.1. CVE-2020-2551 (IIOP deser) — single-capture, 12.x only

Same capture→replay pipeline as above, but with one twist: the gadget
chain uses Y4er's `com.bea.core.repackaged.springframework
.transaction.jta.JtaTransactionManager` wrapped in an
`AnnotationInvocationHandler` proxy (Permit library bypass of the JDK
reflection warnings). The proxy is delivered via IIOP `rebind_any`,
and `JtaTransactionManager.readObject` runs server-side —
`lookupUserTransaction` performs a JNDI lookup on the attacker
`userTransactionName`, which fires the DNS callback. CVSS 9.8.

The pre-January-2020 CPU IIOP class filter did not block this proxy;
the January-2020 CPU (and everything in the 14.1.1 line) does. The
14.1.1 lab reproduces that behaviour: the Java PoC runs to completion
without the server dialing out. So the template:

- runs the T3 HELO probe to read the WebLogic major version;
- arms the active IIOP send **only when HELO says 10 or 12**
  (`ver === "12" || ver === "10"`), and reports no-match on anything
  else without even opening the IIOP socket;
- replays a single captured 12.2.1.4 byte stream, patching only the
  per-session 8-byte OBJECT_KEY (same 0x60 + variable-length + 0x75
  walker) and the 96-byte marker URL.

Lab-verified: 12.2.1.4 → **3/3 matches** without any
`-interactions-cooldown-period` tuning (~21s per run). 14.1.1 →
correctly skipped (~5-6s run, HELO-only).

### 2.2. Why only 20931 (and not 21006 / 21182) has an active OAST template

All three CVEs come from the same WebLogic JNDI family and share the
capture→replay pipeline. Updated finding: **all three are reachable by a
nuclei-style scanner — but 21006 and 21182 only via IIOP, not T3**:

| CVE | Gadget | T3 lookup | IIOP resolve_any |
|-----|--------|-----------|------------------|
| 2024-20931 | `weblogic.deployment.jms.ForeignOpaqueReference` | **server-side** (direct `OpaqueReference` interface) | server-side |
| 2024-21182 | `weblogic.ejb.container.internal.AggregatableOpaqueReference` | **client-side** (cluster-aware; server treats foreign JVMIDs as do-not-resolve, returns Reference) | **server-side** (CORBA path forces `WLNamingManager.getObjectInstance` server-side) |
| 2024-21006 | `weblogic.application.naming.MessageDestinationReference` | **client-side** (plain `javax.naming.Reference`, returned verbatim) | **server-side** (same reason as 21182) |

Lab-proved by running the Java PoC from an isolated attacker container and
reading the callback source IP — see §6 in
`../PoC-active-lab-verified/README.md`. Over **T3**, callbacks for 21006/21182
originate from the attacker JVM (not scanner-reachable). Over **IIOP** on the
same labs, callbacks originate from the WLS server JVM — nuclei is able to
drive this via the javascript protocol.

So the active OAST templates in this folder cover the IIOP path for all three,
not T3. The IIOP pipeline mirrors ProjectDiscovery's CVE-2023-21839 template:
send a GIOP LocateRequest for `NameService`, parse the LocateReply to extract
the per-session `OBJECT_KEY`, and patch the captured `rebind_any` +
`resolve_any` frames with the fresh key before sending them on the same socket.
Compared to CVE-2023-21839 it is slightly simpler — one key suffices (no
`key1`/`key2`/`key3` dance), because the IOR components we need are plain
`BEA 0x2c` / `0x2e` blocks whose 8-byte payload is the only session-dependent
value — but one extra byte-level nuance applies: WebLogic 14.1.1 uses `0x2e`
instead of `0x2c` as the BEA version flag, so the template auto-detects the
flag from the LocateReply and rewrites `4245412c` → `4245412e` in the body.

**Version coverage for 21006/21182 IIOP templates:** both templates now embed
TWO captured byte streams (one per major WLS version) and probe the T3 HELO
line before the IIOP exchange to pick the right one. This mirrors the
`if (ver === '12') { ... } else if (ver === '14') { ... }` structure in the
official CVE-2023-21839 template — just applied to the full `rebind_any` +
`resolve_any` body rather than only a BEA flag byte. Why the second capture is
needed at all: the TRMI stub identifier `TRMI:<class>:<HASH1>:<HASH2>`
embedded in the gadget's wire form has `HASH1`/`HASH2` recomputed by `rmic` on
every WebLogic rebuild, so the 12.2.1.4 identifier is rejected by 14.1.1
server's stub validator (and vice versa). The underlying Java gadget chain
(fields, `getReferent` / `lookupMessageDestination` logic) is unchanged — only
the ~16-byte identifier differs.

Lab-verified (`-interactions-cooldown-period 30`): CVE-2024-21006 matches 3/3
on both labs; CVE-2024-21182 matches 3/3 on 14.1.1 and 2/3 on 12.2.1.4 (one
public interactsh miss — not a template issue, same noise rate seen with
upstream templates).

## 3. Coverage map

| CVE | Vuln type | Template status | File / source | Detection type |
|-----|-----------|-----------------|---------------|----------------|
| CVE-2020-2551  | IIOP deser RCE            | **created — LAB-VERIFIED active IIOP** (12.2.1.4; 14.1.1 patched → auto-skipped) | `CVE-2020-2551-active-oast.yaml` | **active OAST (IIOP)** |
| CVE-2020-2555  | Coherence T3 deser RCE    | **created — LAB-VERIFIED active IIOP** (12.2.1.4; 14.1.1 ReflectionExtractor blacklisted → auto-skipped) | `CVE-2020-2555-active-oast.yaml` | **active OAST (IIOP)** |
| CVE-2020-2883  | T3/IIOP deser RCE         | **created — LAB-VERIFIED active IIOP** (12.2.1.4; 14.1.1 ReflectionExtractor blacklisted → auto-skipped) | `CVE-2020-2883-active-oast.yaml` | **active OAST (IIOP)** |
| CVE-2020-14644 | T3 defineClass RCE        | **created — LAB-VERIFIED active T3** (12.2.1.4 + 14.1.1) | `CVE-2020-14644-active-oast.yaml` | **active OAST (T3)** |
| CVE-2020-14645 | T3/IIOP JNDI deser RCE    | **created — LAB-VERIFIED active IIOP** (12.2.1.4 + 14.1.1) | `CVE-2020-14645-active-oast.yaml` | **active OAST (IIOP)** |
| CVE-2020-14825 | Coherence T3/IIOP RCE     | **created — LAB-VERIFIED active T3** (12.2.1.4 + 14.1.1) | `CVE-2020-14825-active-oast.yaml` | **active OAST (T3)** |
| CVE-2020-14841 | IIOP JNDI deser RCE       | **created — LAB-VERIFIED active IIOP** (12.2.1.4 + 14.1.1) | `CVE-2020-14841-active-oast.yaml` | **active OAST (IIOP)** |
| CVE-2020-14756 | Coherence ExternalizableHelper RCE | **created — LAB-VERIFIED active IIOP** (12.2.1.4 + 14.1.1) | `CVE-2020-14756-active-oast.yaml` | **active OAST (IIOP)** |
| CVE-2020-14882 | Console auth bypass       | _upstream_  | `http/cves/2020/CVE-2020-14882.yaml` | active HTTP |
| CVE-2020-14883 | Console code injection    | _upstream_  | `http/cves/2020/CVE-2020-14883.yaml` | active HTTP |
| CVE-2020-14750 | Console auth bypass       | _upstream_  | `http/cves/2020/CVE-2020-14750.yaml` | active HTTP |
| CVE-2021-2109  | Console JNDI RCE (chained 14882) | **created — LAB-VERIFIED active HTTP** (12.2.1.4 + 14.1.1) | `CVE-2021-2109-active-oast.yaml` | **active OAST (HTTP)** |
| CVE-2021-2135  | T3/IIOP deser RCE         | _upstream_  | `http/cves/2021/CVE-2021-2135.yaml` | active OAST |
| CVE-2021-2136  | Coherence 2nd-order deser RCE  | **created — LAB-VERIFIED active T3** (12.2.1.4 + 14.1.1) | `CVE-2021-2136-active-oast.yaml` | **active OAST (T3)** |
| CVE-2021-2211  | T3/IIOP XXE info leak     | **created — LAB-VERIFIED active T3** (12.2.1.4 + 14.1.1) | `CVE-2021-2211-active-oast.yaml` | **active OAST (T3)** |
| CVE-2021-2394  | T3/IIOP deser RCE         | **created — LAB-VERIFIED active T3** (12.2.1.4 + 14.1.1) | `CVE-2021-2394-active-oast.yaml` | **active OAST (T3)** |
| CVE-2022-21371 | LFI / path traversal      | _upstream_  | `http/cves/2022/CVE-2022-21371.yaml` | active HTTP |
| CVE-2023-21839 | T3/IIOP JNDI RCE          | **upstream active (local copy)** | `CVE-2023-21839-active-oast.yaml` | active OAST |
| CVE-2023-21931 | T3/IIOP JNDI (LinkRef)    | **created — LAB-VERIFIED active IIOP** (12.2.1.4 + 14.1.1) | `CVE-2023-21931-active-oast.yaml` (version-branching) | **active OAST (IIOP)** |
| CVE-2024-20931 | T3/IIOP JNDI RCE          | **created — LAB-VERIFIED active** | `CVE-2024-20931-active-oast.yaml` | **active OAST** |
| CVE-2024-21006 | T3/IIOP double-JNDI RCE   | **created — LAB-VERIFIED active IIOP** (12.2.1.4 + 14.1.1) | `CVE-2024-21006-active-oast.yaml` (version-branching) | **active OAST (IIOP)** |
| CVE-2024-21182 | T3/IIOP JNDI RCE (KEV)    | **created — LAB-VERIFIED active IIOP** (12.2.1.4 + 14.1.1) | `CVE-2024-21182-active-oast.yaml` (version-branching) | **active OAST (IIOP)** |
| CVE-2026-60206 | SAML auth bypass (XSW)    | **created — detection** (T3 version + SAML2-endpoint probe; not active OAST — see note) | `CVE-2026-60206.yaml` | version + SAML2 probe |

**18 templates created**; 5 already covered upstream = 23/23 covered.
Seventeen of the 18 are **active OAST** (not version-fingerprint): CVE-2020-2551,
CVE-2020-2555, CVE-2020-2883, CVE-2020-14644, CVE-2020-14645, CVE-2020-14756,
CVE-2020-14825, CVE-2020-14841, CVE-2021-2109, CVE-2021-2136, CVE-2021-2211,
CVE-2021-2394, CVE-2023-21839, CVE-2023-21931, CVE-2024-20931, CVE-2024-21006,
CVE-2024-21182. The one remaining detection-only template is CVE-2026-60206: it
is a SAML XSW / signature-vs-identity auth bypass that (a) is not out-of-band
confirmable (the proof is an authenticated session, not a callback), (b) requires
the target to have SAML2 federation configured — default WebLogic returns 404 on
`/saml2/*`, so the labs can only verify the version signal — and (c) needs the
target SP's own metadata to forge an assertion. It therefore ships as an exposure
detector (affected T3 version + live SAML2 endpoint discovery), not an active
exploit.

**10.3.6 coverage note.** Several CVEs list WebLogic 10.3.6 as affected
(e.g. CVE-2020-2551/2883/14645/14841, CVE-2021-2394/2211), but the active-OAST
templates for the Coherence-based paths target 12.1.3+/14.x only. Their payloads
are Coherence/EclipseLink delivery gadgets (AttributeHolder, TopNAggregator,
FilterExtractor, LockVersionExtractor, ExternalizableHelper) that a stock 10.3.6
install does not ship — a 10.3.6 target throws ClassNotFoundException before the
chain runs (verified by booting vulhub/weblogic:10.3.6.0-2017: those classes are
absent from every jar). 10.3.6 also predates the JEP 290 deserialization filter,
so exploiting it would use a simpler direct gadget rather than the Coherence
bypass. Covering 10.3.6 would require separate, pre-JEP290 payloads captured on a
working 10.3.6 lab; note no WebLogic 10.3.6 image is published for arm64, so the
only options emulate amd64 under qemu. The HTTP-console chains (CVE-2021-2109,
and upstream CVE-2020-14882) are payload-text, not serialized bytes, and do fire
on 10.3.6.

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

## 5. Caveats & disclaimer

- T3 templates report **base-version exposure**, which can be a false positive on
  fully patched hosts (same base version, patched internals). Confirm CPU level.
- `CVE-2026-60206` relies on T3 version only (public SAML PoCs are unverified —
  one uses a `placeholder_signature`).
- Use only against systems you are authorized to test.
