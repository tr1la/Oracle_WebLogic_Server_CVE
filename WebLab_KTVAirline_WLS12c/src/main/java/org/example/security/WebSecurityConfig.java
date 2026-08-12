package org.example.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
public class WebSecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Autowired
    private UploadOwnerAuthorizationManager uploadOwnerAuthorizationManager;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth ->
                auth.requestMatchers(antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()
                    .requestMatchers(
                            antMatcher("/v3/**"),
                            antMatcher("/swagger-ui/**"),
                            antMatcher("/swagger-ui"),
                            antMatcher("/swagger-ui.html")).permitAll()
                    .requestMatchers(antMatcher("/uploads/**")).access(uploadOwnerAuthorizationManager)
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/profile/basic-info")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.POST, "/api/v1/auth/login"),
                            antMatcher(HttpMethod.POST, "/api/v1/auth/signup"),
                            antMatcher(HttpMethod.POST, "/api/v1/auth/forgetP")).permitAll()
                    .requestMatchers(
                            antMatcher(HttpMethod.GET, "/api/v1/news/**"),
                            antMatcher(HttpMethod.GET, "/api/v1/promotion/**"),
                            antMatcher(HttpMethod.GET, "/api/v1/flight/**"),
                            antMatcher(HttpMethod.GET, "/api/v1/plane/**"),
                            antMatcher(HttpMethod.GET, "/api/v1/seat/**"),
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/flight/availability")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.PUT, "/api/v1/auth/changeP")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.GET, "/api/v1/user/email"),
                            antMatcher(HttpMethod.GET, "/api/v1/user/id")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.POST, "/api/v1/user/*/avatar")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.PUT, "/api/v1/user")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/user/all")).hasRole("ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.DELETE, "/api/v1/user")).hasRole("ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/all"),
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/status")).hasRole("ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/conditions"),
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/id"),
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/flight"),
                            antMatcher(HttpMethod.GET, "/api/v1/transaction/flight/availability")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.PUT, "/api/v1/transaction"),
                            antMatcher(HttpMethod.PUT, "/api/v1/transaction/list")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.POST, "/api/v1/transaction")).hasRole("ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.DELETE, "/api/v1/transaction")).hasRole("ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.POST, "/api/v1/booking/quote"),
                            antMatcher(HttpMethod.POST, "/api/v1/booking/hold"),
                            antMatcher(HttpMethod.POST, "/api/v1/booking/apply-promotion"),
                            antMatcher(HttpMethod.POST, "/api/v1/booking/confirm"),
                            antMatcher(HttpMethod.POST, "/api/v1/booking/draft/save"),
                            antMatcher(HttpMethod.POST, "/api/v1/booking/draft/import")).hasAnyRole("USER", "ADMIN")
                    .requestMatchers(antMatcher(HttpMethod.POST, "/api/v1/promotion/import-xml")).hasRole("ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.POST, "/api/v1/news"),
                            antMatcher(HttpMethod.POST, "/api/v1/promotion"),
                            antMatcher(HttpMethod.POST, "/api/v1/flight"),
                            antMatcher(HttpMethod.POST, "/api/v1/plane"),
                            antMatcher(HttpMethod.POST, "/api/v1/seat")).hasRole("ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.PUT, "/api/v1/news"),
                            antMatcher(HttpMethod.PUT, "/api/v1/news/list"),
                            antMatcher(HttpMethod.PUT, "/api/v1/promotion"),
                            antMatcher(HttpMethod.PUT, "/api/v1/promotion/list"),
                            antMatcher(HttpMethod.PUT, "/api/v1/flight"),
                            antMatcher(HttpMethod.PUT, "/api/v1/flight/list"),
                            antMatcher(HttpMethod.PUT, "/api/v1/plane"),
                            antMatcher(HttpMethod.PUT, "/api/v1/seat")).hasRole("ADMIN")
                    .requestMatchers(
                            antMatcher(HttpMethod.DELETE, "/api/v1/news"),
                            antMatcher(HttpMethod.DELETE, "/api/v1/promotion"),
                            antMatcher(HttpMethod.DELETE, "/api/v1/flight"),
                            antMatcher(HttpMethod.DELETE, "/api/v1/plane"),
                            antMatcher(HttpMethod.DELETE, "/api/v1/seat")).hasRole("ADMIN")
                    .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private AntPathRequestMatcher antMatcher(String pattern) {
        return new AntPathRequestMatcher(pattern);
    }

    private AntPathRequestMatcher antMatcher(HttpMethod method, String pattern) {
        return new AntPathRequestMatcher(pattern, method.name());
    }
}
