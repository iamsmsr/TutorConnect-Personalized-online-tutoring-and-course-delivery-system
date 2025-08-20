package com.tutorconnect.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Backend is ready");
    }
}
