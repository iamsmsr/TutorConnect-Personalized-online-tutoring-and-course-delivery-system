package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.service.UserService;
import com.tutorconnect.backend.security.*;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userService.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("{\"success\":false,\"message\":\"Email already exists\"}");
        }
        userService.registerUser(user);
        return ResponseEntity.ok("{\"success\":true}");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        User user = userOpt.get();
        if (!userService.checkPassword(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(Map.of(
            "token", token,
            "role", user.getRole()
        ));
    }
}