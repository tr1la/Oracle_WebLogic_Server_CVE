package org.example.serviceImpl;

import javax.mail.*;
import javax.mail.internet.*;
import org.example.entity.Transaction;

import java.io.UnsupportedEncodingException;
import java.util.Properties;

public class EmailService {
    private static final String DEFAULT_HOST = "smtp.gmail.com";
    private static final int DEFAULT_PORT = 587;
    private static final String DEFAULT_MAIL = "lampestdoo@gmail.com";
    private static final String DEFAULT_FROM_NAME = "KTVAirline";

    private final String username;
    private final String password;
    private final String fromAddress;
    private final String fromName;

    private final Properties prop;

    public EmailService() {
        this(
                getEnv("MAIL_HOST", DEFAULT_HOST),
                getIntEnv("MAIL_PORT", DEFAULT_PORT),
                getEnv("MAIL_USERNAME", DEFAULT_MAIL),
                getEnv("MAIL_PASSWORD", ""),
                getEnv("MAIL_FROM", getEnv("MAIL_USERNAME", DEFAULT_MAIL)),
                getEnv("MAIL_FROM_NAME", DEFAULT_FROM_NAME)
        );
    }

    private EmailService(String host, int port, String username, String password, String fromAddress, String fromName) {
        prop = new Properties();
        prop.put("mail.smtp.auth", "true");
        prop.put("mail.smtp.starttls.enable", "true");
        prop.put("mail.smtp.host", host);
        prop.put("mail.smtp.port", String.valueOf(port));
        prop.put("mail.smtp.ssl.trust", host);

        this.username = username;
        this.password = password;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    public void send(String text, String account) {
        try {
            sendMail(text, account);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot send password reset email.", e);
        }
    }

    public void sendNotification(Transaction transaction) {
        try {
            sendNoti(transaction);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot send flight notification email.", e);
        }
    }

    public void sendMail(String text, String account) throws MessagingException, UnsupportedEncodingException {
        Session session = createSession();

        Message message = new MimeMessage(session);
        message.setFrom(getFromAddress());
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(account));
        message.setSubject("Lấy lại mật khẩu");

        String msg = "Mật khẩu tạm thời của bạn là :" + text +". Vui lòng đổi mật khẩu sau khi vào lại!";

        MimeBodyPart mimeBodyPart = new MimeBodyPart();
        mimeBodyPart.setContent(msg, "text/html; charset=utf-8");

        Multipart multipart = new MimeMultipart();
        multipart.addBodyPart(mimeBodyPart);

        message.setContent(multipart);

        Transport.send(message);
    }

    public void sendNoti(Transaction transaction) throws MessagingException, UnsupportedEncodingException {
        Session session = createSession();

        Message message = new MimeMessage(session);
        message.setFrom(getFromAddress());
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(transaction.getUser().getEmail()));
        message.setSubject("Nhắc nhở về chuyến bay số " + transaction.getFlight().getName());


        String msg = "Chuyến bay có mã số" + transaction.getFlight().getName()
                + " do gặp sự cố nên đã chuyển giờ khởi hành thành " + transaction.getFlight().getStartTime()
                + ". Chúng tôi vô cùng xin lỗi và mong quý khách thông cảm cho sự cố lần này";

        MimeBodyPart mimeBodyPart = new MimeBodyPart();
        mimeBodyPart.setContent(msg, "text/html; charset=utf-8");

        Multipart multipart = new MimeMultipart();
        multipart.addBodyPart(mimeBodyPart);

        message.setContent(multipart);

        Transport.send(message);
    }

    private Session createSession() {
        if (isBlank(username) || isBlank(password) || isBlank(fromAddress)) {
            throw new IllegalStateException("Missing mail config. Please set MAIL_USERNAME, MAIL_PASSWORD and MAIL_FROM.");
        }

        return Session.getInstance(prop, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });
    }

    private InternetAddress getFromAddress() throws UnsupportedEncodingException {
        InternetAddress address = new InternetAddress();
        address.setAddress(fromAddress);
        if (isBlank(fromName)) {
            return address;
        }
        address.setPersonal(fromName, "UTF-8");
        return address;
    }

    private static String getEnv(String name, String defaultValue) {
        String value = System.getenv(name);
        return isBlank(value) ? defaultValue : value;
    }

    private static int getIntEnv(String name, int defaultValue) {
        String value = System.getenv(name);
        if (isBlank(value)) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
