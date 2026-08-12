package org.example.config;

import freemarker.core.TemplateClassResolver;
import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class FreeMarkerSandboxConfig {
    @Bean
    public Configuration sandboxedFreeMarkerConfiguration() {
        Configuration configuration = new Configuration(Configuration.VERSION_2_3_29);
        configuration.setClassLoaderForTemplateLoading(
                Thread.currentThread().getContextClassLoader(),
                "templates");
        configuration.setNewBuiltinClassResolver(TemplateClassResolver.SAFER_RESOLVER);
        /*
         * SINK ENABLER: SAFER_RESOLVER still allows templates to instantiate
         * application classes that implement TemplateModel, such as helper methods.
         * That keeps the lab chain reachable through "com.example.Helper"?new().
         *
         * FIXED CODE:
         *
         * configuration.setNewBuiltinClassResolver(TemplateClassResolver.ALLOWS_NOTHING_RESOLVER);
         *
         * // If templates need QR output, generate memberQrUrl in ProfileViewController
         * // and let the Freemarker theme render only ${memberQrUrl?html}; do not
         * // re-enable class-name based ?new().
         */
        configuration.setAPIBuiltinEnabled(false);
        configuration.setObjectWrapper(new DefaultObjectWrapper(Configuration.VERSION_2_3_29));
        /*
         * SINK ENABLER: DefaultObjectWrapper is safer for simple values than
         * BeansWrapper, but it still falls back to bean-style wrapping for custom
         * application objects. Since the profile model exposes a ProfileTheme object
         * under profileTheme, that key can still become an anchor for
         * class/protectionDomain/classLoader object-chain payloads.
         *
         * FIXED CODE:
         *
         * configuration.setObjectWrapper(
         *         new freemarker.template.SimpleObjectWrapper(Configuration.VERSION_2_3_29));
         *
         * // For real custom helpers, expose small audited TemplateMethodModelEx
         * // instances instead of generic Java object/method access.
         */
        configuration.setLogTemplateExceptions(false);
        configuration.setWrapUncheckedExceptions(true);
        configuration.setFallbackOnNullLoopVariable(false);
        return configuration;
    }
}
