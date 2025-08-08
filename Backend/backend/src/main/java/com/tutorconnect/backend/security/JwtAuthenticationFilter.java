package com.tutorconnect.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final String SECRET = "bXlTdXBlclNlY3JldEtleU1ha2VJdFNhZmVfYW5kQmFzZTY0IQ==";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(java.util.Base64.getDecoder().decode(SECRET))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                String email = claims.getSubject();
                String role = claims.get("role", String.class);
                if (email != null && role != null) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // Invalid token, do nothing (will result in 403 if required)
            }
        }
        filterChain.doFilter(request, response);
    }
}
