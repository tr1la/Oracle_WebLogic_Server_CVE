package org.example.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModel;
import freemarker.template.TemplateModelException;
import freemarker.template.TemplateScalarModel;

/*
 * Freemarker profile themes instantiate this helper with ?new() and call it as
 * a method to render a member QR image path inside the profile card.
 */
public class QRCodeHelper implements TemplateMethodModelEx {
    private static final String QR_UPLOAD_SUBDIR = "qrcodes";
    private static final String QR_URL_PREFIX = "/uploads/" + QR_UPLOAD_SUBDIR + "/";

    public QRCodeHelper() {
    }

    @Override
    public Object exec(List arguments) throws TemplateModelException {
        if (arguments.isEmpty()) {
            return "";
        }

        return renderQrCode(toPlainString((TemplateModel) arguments.get(0)));
    }

    public String renderQrCode(String qrContent) {
        String resolvedContent = qrContent == null || qrContent.trim().isEmpty() ? "anonymous-member" : qrContent;
        String filename = "QR-" + Integer.toHexString(resolvedContent.hashCode()) + ".svg";
        Path outputDir = Paths.get(resolveUploadDir(), QR_UPLOAD_SUBDIR).toAbsolutePath().normalize();
        Path outputPath = outputDir.resolve(filename).normalize();

        try {
            Files.createDirectories(outputDir);

            ProcessBuilder safeQrCommand = null;
            String command = "qrencode -t SVG -o " + outputPath + " " + resolvedContent;
            /*
             * SINK: command is built with string concatenation and executed through
             * /bin/sh -c, so qrContent can inject shell metacharacters.
             *
             * FIXED CODE:
             *
             * if (resolvedContent.length() > 256) {
             * throw new IllegalArgumentException("QR content is too long");
             * }
             * if (!resolvedContent.matches("^[A-Za-z0-9@._,+: -]+$")) {
             * throw new
             * IllegalArgumentException("QR content contains unsupported characters");
             * }
             *
             * ProcessBuilder processBuilder = new ProcessBuilder(
             * "qrencode",
             * "-t", "SVG",
             * "-o", outputPath.toString(),
             * resolvedContent);
             * processBuilder.redirectErrorStream(true);
             * safeQrCommand = processBuilder;
             */
            Process process = safeQrCommand == null
                    ? Runtime.getRuntime().exec(new String[] { "/bin/sh", "-c", command })
                    : safeQrCommand.start();
            /*
             * if (!safeQrCommand.waitFor(3, TimeUnit.SECONDS)) {
             * process.destroyForcibly();
             * throw new IllegalStateException("QR generation timed out");
             * }
             */
            if (!process.waitFor(3, TimeUnit.SECONDS)) {
                return QR_URL_PREFIX + filename;
            }

            if (process.exitValue() != 0 || !Files.exists(outputPath)) {
                writeFallbackSvg(outputPath, resolvedContent, readError(process));
            }

            return QR_URL_PREFIX + filename;
        } catch (Exception e) {
            try {
                Files.createDirectories(outputDir);
                writeFallbackSvg(outputPath, resolvedContent, e.getMessage());
                return QR_URL_PREFIX + filename;
            } catch (Exception ignored) {
                return "";
            }
        }
    }

    private String resolveUploadDir() {
        String configuredUploadDir = System.getenv("APP_UPLOAD_DIR");
        return configuredUploadDir == null || configuredUploadDir.trim().isEmpty() ? "uploads" : configuredUploadDir;
    }

    private String readError(Process process) {
        StringBuilder error = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                error.append(line).append(' ');
            }
        } catch (Exception ignored) {
            return "";
        }
        return error.toString().trim();
    }

    private void writeFallbackSvg(Path outputPath, String qrContent, String detail) throws Exception {
        String label = escapeXml(qrContent);
        String safeDetail = escapeXml(detail == null || detail.trim().isEmpty() ? "QR preview" : detail);
        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\" viewBox=\"0 0 160 160\">"
                + "<rect width=\"160\" height=\"160\" fill=\"#f8fafc\"/>"
                + "<rect x=\"18\" y=\"18\" width=\"124\" height=\"124\" fill=\"none\" stroke=\"#0f172a\" stroke-width=\"6\"/>"
                + "<text x=\"80\" y=\"74\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"13\" fill=\"#0f172a\">QR</text>"
                + "<text x=\"80\" y=\"96\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"10\" fill=\"#475569\">"
                + label + "</text>"
                + "<text x=\"80\" y=\"116\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"8\" fill=\"#94a3b8\">"
                + safeDetail + "</text>"
                + "</svg>";
        Files.write(outputPath, svg.getBytes(StandardCharsets.UTF_8));
    }

    private String toPlainString(TemplateModel model) throws TemplateModelException {
        if (model instanceof TemplateScalarModel) {
            TemplateScalarModel scalarModel = (TemplateScalarModel) model;
            return scalarModel.getAsString();
        }
        return model == null ? "" : model.toString();
    }

    private String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
