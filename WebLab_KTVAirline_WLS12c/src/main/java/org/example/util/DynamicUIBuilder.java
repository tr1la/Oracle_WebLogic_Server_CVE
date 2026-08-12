package org.example.util;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateHashModel;
import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModel;
import freemarker.template.TemplateModelException;
import freemarker.template.TemplateScalarModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.io.StringReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DynamicUIBuilder implements TemplateHashModel {
    private final Configuration configuration;
    private final Path componentRoot;
    private final TemplateMethodModelEx renderTemplateMethod = this::renderTemplateFromFreemarker;
    private final TemplateMethodModelEx loadAndRenderComponentMethod = this::loadAndRenderComponentFromFreemarker;

    public DynamicUIBuilder(@Qualifier("sandboxedFreeMarkerConfiguration") Configuration configuration,
                            @Value("${app.dynamic-ui-component-dir:templates/components}") String componentDir) {
        this.configuration = configuration;
        this.componentRoot = Paths.get(componentDir).toAbsolutePath().normalize();
    }

    public String renderTemplate(String templateSource) {
        return renderTemplate(templateSource, baseModel());
    }

    public String renderTemplate(String templateSource, Map<String, Object> model) {
        try {
            Template template = new Template("dynamic-ui", new StringReader(templateSource), configuration);
            StringWriter writer = new StringWriter();
            template.process(model, writer);
            return writer.toString();
        } catch (Exception e) {
            return errorMessage("Error rendering profile", e);
        }
    }

    public String loadAndRenderComponent(String componentPath) {
        try {
            /*
             * Security lab: intentionally resolve user-controlled paths without
             * enforcing that the final path stays under componentRoot.
             */
            Path resolvedPath = componentRoot.resolve(componentPath).normalize();
            String templateSource = new String(Files.readAllBytes(resolvedPath), StandardCharsets.UTF_8);
            return renderTemplate(templateSource);
        } catch (Exception e) {
            return errorMessage("Error loading component", e);
        }
    }

    @Override
    public TemplateModel get(String key) {
        if ("renderTemplate".equals(key)) {
            return renderTemplateMethod;
        }
        if ("loadAndRenderComponent".equals(key)) {
            return loadAndRenderComponentMethod;
        }
        return null;
    }

    @Override
    public boolean isEmpty() {
        return false;
    }

    private Object renderTemplateFromFreemarker(List arguments) throws TemplateModelException {
        if (arguments.isEmpty()) {
            return "";
        }

        return renderTemplate(toPlainString((TemplateModel) arguments.get(0)));
    }

    private Object loadAndRenderComponentFromFreemarker(List arguments) throws TemplateModelException {
        if (arguments.isEmpty()) {
            return "";
        }

        return loadAndRenderComponent(toPlainString((TemplateModel) arguments.get(0)));
    }

    private String toPlainString(TemplateModel model) throws TemplateModelException {
        if (model instanceof TemplateScalarModel) {
            TemplateScalarModel scalarModel = (TemplateScalarModel) model;
            return scalarModel.getAsString();
        }
        return model == null ? "" : model.toString();
    }

    private Map<String, Object> baseModel() {
        Map<String, Object> model = new HashMap<>();
        model.put("dynamicUIBuilder", this);
        return model;
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
