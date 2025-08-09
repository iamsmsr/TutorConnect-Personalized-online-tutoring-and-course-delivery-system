package com.tutorconnect.backend.security;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.stereotype.Component;
import com.tutorconnect.backend.model.User;

@Component
public class JwtUtil {
    // Use a valid base64 string for the secret key (at least 32 bytes)
    private final String SECRET = "bXlTdXBlclNlY3JldEtleU1ha2VJdFNhZmVfYW5kQmFzZTY0IQ=="; // example: "mySuperSecretKeyMakeItSafe_andBase64!" base64 encoded
    private final long EXPIRATION = 86400000; // 1 day

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(java.util.Base64.getDecoder().decode(SECRET));
    }

    public String generateToken(User user) {
        return Jwts.builder()
            .setSubject(user.getEmail())
            .claim("role", user.getRole())
            .claim("username", user.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(getSigningKey())
            .compact();
    }
}