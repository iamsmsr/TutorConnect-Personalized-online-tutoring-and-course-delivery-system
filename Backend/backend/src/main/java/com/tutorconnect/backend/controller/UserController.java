package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.repository.UserRepository;
import com.tutorconnect.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // Get current user profile
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal String email) {
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
    }

    // Update current user profile (fields: username, email, bio, subjects, languages, availability, password)
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal String email, @RequestBody Map<String, Object> updates) {
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
        }
        User user = userOpt.get();
        if (updates.containsKey("username")) user.setUsername((String) updates.get("username"));
        if (updates.containsKey("email")) user.setEmail((String) updates.get("email"));
        if (updates.containsKey("bio")) user.setBio((String) updates.get("bio"));
        if (updates.containsKey("subjects")) {
            var subjRaw = updates.get("subjects");
            if (subjRaw instanceof java.util.List<?>) {
                java.util.List<?> rawList = (java.util.List<?>) subjRaw;
                java.util.List<String> strList = rawList.stream().map(Object::toString).toList();
                user.setSubjects(strList);
            }
        }
        if (updates.containsKey("languages")) {
            var langRaw = updates.get("languages");
            if (langRaw instanceof java.util.List<?>) {
                java.util.List<?> rawList = (java.util.List<?>) langRaw;
                java.util.List<String> strList = rawList.stream().map(Object::toString).toList();
                user.setLanguages(strList);
            }
        }
        if (updates.containsKey("availability")) user.setAvailability((String) updates.get("availability"));
        if (updates.containsKey("password") && updates.get("password") != null && !((String) updates.get("password")).isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode((String) updates.get("password")));
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
