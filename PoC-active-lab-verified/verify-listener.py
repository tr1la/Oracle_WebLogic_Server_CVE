#!/usr/bin/env python3
# OAST substitute for an isolated lab: a TCP listener that logs any inbound
# connection. If WebLogic connects here after the lookup, the JNDI injection
# fired. Run on the host; point the PoC's attacker URL at host.docker.internal.
import socket, threading, sys, datetime
PORT = 18099
def handle(c, a):
    line = "[%s] CALLBACK from %s\n" % (datetime.datetime.now().isoformat(), a)
    sys.stdout.write(line); sys.stdout.flush()
    try:
        c.settimeout(2); data = c.recv(64)
        if data:
            sys.stdout.write("    first-bytes: %s  (4a524d49='JRMI' => RMI/JRMP)\n" % data[:16].hex())
    except Exception:
        pass
    c.close()
def main():
    s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("0.0.0.0", PORT)); s.listen(10)
    sys.stdout.write("[*] callback listener on 0.0.0.0:%d\n" % PORT); sys.stdout.flush()
    while True:
        c, a = s.accept(); threading.Thread(target=handle, args=(c, a)).start()
if __name__ == "__main__":
    main()
