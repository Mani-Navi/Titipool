package com.VTT.V10.config;

import com.VTT.V10.auth.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Stateless once-per-request authentication filter for extracting and validating JWT tokens.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(BEARER_PREFIX.length());
        try {
            if (jwtService.validateToken(jwt)) {
                final String userEmail = jwtService.extractEmail(jwt);

                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    if (jwtService.isTokenValid(jwt, userEmail)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userEmail,
                                null,
                                Collections.emptyList()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } else {
                SecurityContextHolder.clearContext();
            }
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            if (log.isDebugEnabled()) {
                log.debug("JWT authentication filter rejected token validation: {}", ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}