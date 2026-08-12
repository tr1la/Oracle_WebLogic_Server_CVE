package org.example.util;

import freemarker.template.Configuration;
import freemarker.template.MalformedTemplateNameException;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateNotFoundException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class CustomThemeLoader {
    private static final String DEFAULT_THEME = "light_mode.ftl";
    private static final Pattern OBVIOUS_PARENT_TRAVERSAL = Pattern.compile("(^|/)\\.\\./(?!/)");
    /*
     * The regex above only catches a parent segment followed by a single slash.
     * It misses repeated separators such as "..//" before the filesystem resolves
     * them as normal path separators.
     *
     * FIXED CODE:
     *
     * private static final Pattern OBVIOUS_PARENT_TRAVERSAL =
     * Pattern.compile("(^|[\\\\/])\\.\\.(?:[\\\\/]+|$)");
     *
     */

    private final Configuration configuration;
    private final Path customThemeRoot;

    public CustomThemeLoader(@Qualifier("sandboxedFreeMarkerConfiguration") Configuration configuration,
            @Value("${app.profile-theme-custom-dir:data/custom_themes}") String customThemeDir) {
        this.configuration = configuration;
        this.customThemeRoot = Paths.get(customThemeDir).toAbsolutePath().normalize();
    }

    public String loadProfileTheme(String themeName, Map<String, Object> model) {
        String resolvedThemeName;
        try {
            resolvedThemeName = resolveThemeName(themeName);
        } catch (Exception e) {
            return errorMessage("Error resolving profile theme", e);
        }

        try {
            return loadClasspathTheme(resolvedThemeName, model);
        } catch (TemplateNotFoundException | MalformedTemplateNameException e) {
            return loadFilesystemTheme(resolvedThemeName, model);
        } catch (Exception e) {
            return errorMessage("Error rendering profile theme", e);
        }
    }

    private String loadClasspathTheme(String themeName, Map<String, Object> model)
            throws IOException, TemplateException {
        // The client supplies the full template filename; this flow does not append
        // ".ftl".
        Template template = configuration.getTemplate("themes/" + themeName);
        /*
         * SINK: a user-controlled themeName is concatenated into a template path.
         *
         * FIXED CODE:
         *
         * java.util.Map<String, String> themeAllowlist = java.util.Map.of(
         *         "light_mode.ftl", "themes/light_mode.ftl",
         *         "dark_mode.ftl", "themes/dark_mode.ftl");
         *
         * String templatePath = themeAllowlist.getOrDefault(themeName, "themes/light_mode.ftl");
         * Template template = configuration.getTemplate(templatePath);
         */
        StringWriter writer = new StringWriter();
        template.process(model, writer);
        return writer.toString();
    }

    private String loadFilesystemTheme(String themeName, Map<String, Object> model) {
        try {
            Path resolvedThemePath = customThemeRoot.resolve(themeName);
            /*
             * SINK: repeated slashes are left in the path sent to the filesystem.
             * The weak filter misses "..//", while filesystem path resolution still
             * treats it as a parent-directory traversal outside customThemeRoot.
             *
             * FIXED CODE:
             *
             * Path root = customThemeRoot.toRealPath();
             * Path candidate = root.resolve(themeName).normalize();
             * if (!candidate.startsWith(root)
             *         || candidate.getFileName() == null
             *         || !candidate.getFileName().toString().endsWith(".ftl")) {
             *     throw new IllegalArgumentException("Invalid theme path");
             * }
             * Path resolvedThemePath = candidate.toRealPath();
             * if (!resolvedThemePath.startsWith(root)) {
             *     throw new IllegalArgumentException("Invalid theme path");
             * }
             */
            String templateSource = new String(Files.readAllBytes(resolvedThemePath), StandardCharsets.UTF_8);
            /*
             * SINK: Files.readString reads the attacker-selected path after the
             * traversal above. If that path is an access log, this becomes LFI.
             *
             * FIXED CODE:
             *
             * byte[] bytes = Files.readAllBytes(resolvedThemePath);
             * if (bytes.length > 64 * 1024) {
             * throw new IllegalArgumentException("Theme file is too large");
             * }
             * String templateSource = new String(bytes, StandardCharsets.UTF_8);
             */
            return renderTemplateSource(templateSource, model);
        } catch (Exception e) {
            return errorMessage("Error loading custom theme", e);
        }
    }

    private String renderTemplateSource(String templateSource, Map<String, Object> model)
            throws IOException, TemplateException {
        Template template = new Template("filesystem-profile-theme", new StringReader(templateSource), configuration);
        /*
         * SINK: attacker-controlled file content is parsed as a Freemarker template.
         * In the log-poisoning chain, the access log content becomes SSTI here.
         *
         * FIXED CODE:
         *
         * String safeTemplateSource = escapeHtml(templateSource);
         * return "<pre>" + safeTemplateSource + "</pre>";
         */
        StringWriter writer = new StringWriter();
        template.process(model, writer);
        return writer.toString();
    }

    private String resolveThemeName(String themeName) {
        if (!StringUtils.hasText(themeName)) {
            return DEFAULT_THEME;
        }

        String resolvedThemeName = themeName.trim();
        rejectRelativeParentPath(resolvedThemeName, "Theme path cannot contain ../");
        return resolvedThemeName;
    }

    private void rejectRelativeParentPath(String value, String message) {
        if (OBVIOUS_PARENT_TRAVERSAL.matcher(value).find()) {
            throw new IllegalArgumentException(message);
        }
    }

    private String errorMessage(String title, Exception exception) {
        return "<div class=\"bg-white rounded-xl border border-red-200 p-6 text-sm text-red-700\">"
                + "<p class=\"font-semibold\">" + escapeHtml(title) + "</p>"
                + "<pre class=\"mt-2 whitespace-pre-wrap\">"
                + escapeHtml(exception.getClass().getSimpleName() + ": " + exception.getMessage())
                + "</pre>"
                + "</div>";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
