package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.Rating;
import com.tutorconnect.backend.service.RatingService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/ratings")
public class    RatingController {
    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    // Only allow students to add ratings
    @PostMapping
    public Rating addRating(@RequestBody Rating rating, Authentication authentication, HttpServletRequest request) {
        boolean isStudent = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role -> role.equals("ROLE_STUDENT"));
        if (!isStudent) {
            throw new RuntimeException("Only students can add ratings.");
        }
        
        // Extract username from JWT token
        String authHeader = request.getHeader("Authorization");
        String username = authentication.getName(); // fallback to email
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = Jwts.parserBuilder()
                    .setSigningKey(java.util.Base64.getDecoder().decode("bXlTdXBlclNlY3JldEtleU1ha2VJdFNhZmVfYW5kQmFzZTY0IQ=="))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
                username = claims.get("username", String.class);
                if (username == null) username = authentication.getName();
            } catch (Exception e) {
                username = authentication.getName();
            }
        }
        
        rating.setStudentId(authentication.getName());
        rating.setStudentName(username);
        rating.setCreatedAt(java.time.Instant.now());
        return ratingService.addRating(rating);
    }

    @GetMapping("/course/{courseId}")
    public List<Rating> getRatingsByCourse(@PathVariable String courseId) {
        return ratingService.getRatingsByCourseId(courseId);
    }

    @GetMapping("/course/{courseId}/average")
    public double getAverageRating(@PathVariable String courseId) {
        return ratingService.getAverageRatingForCourse(courseId);
    }
}
