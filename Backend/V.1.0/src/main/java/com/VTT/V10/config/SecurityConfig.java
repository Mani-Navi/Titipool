package com.VTT.V10.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration enforcing stateless authentication, hardened headers, and optimized CORS.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsConfig;

    @Value("${livekit.url:ws://localhost:7880}")
    private String livekitUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        String cspPolicy = String.join("; ",
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client",
                "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style https://fonts.googleapis.com",
                "img-src 'self' data: blob: https: http:",
                "font-src 'self' data: https://fonts.gstatic.com",
                "frame-src 'self' https://accounts.google.com",
                "media-src 'self' blob: data: https:",
                "connect-src 'self' https://accounts.google.com https://*.railway.app https://*.vercel.app " + livekitUrl,
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'"
        );

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)
                                .preload(true)
                        )
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Cross-Origin-Opener-Policy",
                                "same-origin-allow-popups"
                        ))
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Permissions-Policy",
                                "camera=(), microphone=(self), geolocation=()"
                        ))
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Cache-Control",
                                "no-cache, no-store, max-age=0, must-revalidate"
                        ))
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Pragma",
                                "no-cache"
                        ))
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Expires",
                                "0"
                        ))
                        .contentSecurityPolicy(csp -> csp.policyDirectives(cspPolicy))
                )
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setHeader("Cache-Control", "no-store");
                            response.getWriter().write(String.format("{\"error\":\"Unauthorized\",\"status\":401,\"timestamp\":\"%s\"}", Instant.now()));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setHeader("Cache-Control", "no-store");
                            response.getWriter().write(String.format("{\"error\":\"Access denied\",\"status\":403,\"timestamp\":\"%s\"}", Instant.now()));
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/metrics/**",
                                "/ws/**",
                                "/uploads/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        config.setAllowedOrigins(origins.isEmpty() ? List.of("http://localhost:3000", "http://localhost:5173", "https://vtt-pearl.vercel.app") : origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}