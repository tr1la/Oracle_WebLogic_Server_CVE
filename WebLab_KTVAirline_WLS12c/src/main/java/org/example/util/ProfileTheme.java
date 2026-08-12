package org.example.util;

public class ProfileTheme {
    private final String name;
    private final String templatePath;
    private final String displayName;
    private final boolean darkMode;

    public ProfileTheme(String templatePath) {
        this.templatePath = templatePath;
        this.name = stripTemplateSuffix(templatePath);
        this.displayName = resolveDisplayName(name);
        this.darkMode = "dark_mode".equals(name);
    }

    public String getName() {
        return name;
    }

    public String getTemplatePath() {
        return templatePath;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isDarkMode() {
        return darkMode;
    }

    private String stripTemplateSuffix(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "light_mode";
        }
        return value.endsWith(".ftl") ? value.substring(0, value.length() - 4) : value;
    }

    private String resolveDisplayName(String themeName) {
        return "dark_mode".equals(themeName) ? "Dark mode" : "Light mode";
    }
}
