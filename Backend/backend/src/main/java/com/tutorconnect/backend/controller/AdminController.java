
package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdminController {
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create-course")
    public ResponseEntity<?> createCourse(@RequestBody com.tutorconnect.backend.model.Course course) {
        boolean created = adminService.createCourse(course);
        return ResponseEntity.ok(java.util.Map.of("success", created));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/edit-course/{id}")
    public ResponseEntity<?> editCourse(@PathVariable String id, @RequestBody com.tutorconnect.backend.model.Course updatedCourse) {
        boolean updated = adminService.editCourse(id, updatedCourse);
        if (updated) {
            return ResponseEntity.ok(java.util.Map.of("success", true));
        } else {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", "Course not found or update failed"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search-course")
    public ResponseEntity<?> searchCourse(@RequestParam String query) {
        var courses = adminService.searchCourses(query);
        var safeCourses = courses.stream().map(c -> {
            var map = new java.util.HashMap<String, Object>();
            map.put("id", c.getId());
            map.put("title", c.getTitle());
            map.put("description", c.getDescription());
            map.put("tutorId", c.getTutorId());
            map.put("subjects", c.getSubjects());
            map.put("language", c.getLanguage());
            map.put("price", c.getPrice());
            map.put("duration", c.getDuration());
            map.put("studentsEnrolled", c.getStudentsEnrolled());
            map.put("createdAt", c.getCreatedAt());
            map.put("extra", c.getExtra());
            return map;
        }).toList();
        return ResponseEntity.ok(safeCourses);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/courses")
    public ResponseEntity<?> getAllCourses() {
        var courses = adminService.getAllCourses();
        var safeCourses = courses.stream().map(c -> {
            var map = new java.util.HashMap<String, Object>();
            map.put("id", c.getId());
            map.put("title", c.getTitle());
            map.put("description", c.getDescription());
            map.put("tutorId", c.getTutorId());
            map.put("subjects", c.getSubjects());
            map.put("language", c.getLanguage());
            map.put("price", c.getPrice());
            map.put("duration", c.getDuration());
            map.put("studentsEnrolled", c.getStudentsEnrolled());
            map.put("createdAt", c.getCreatedAt());
            map.put("extra", c.getExtra());
            return map;
        }).toList();
        return ResponseEntity.ok(safeCourses);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search-tutor")
    public ResponseEntity<?> searchTutor(@RequestParam String query) {
        var tutors = adminService.searchTutors(query);
        var safeTutors = tutors.stream().map(t -> java.util.Map.of(
            "id", t.getId(),
            "username", t.getUsername(),
            "email", t.getEmail(),
            "role", t.getRole(),
            "bio", t.getBio(),
            "subjects", t.getSubjects(),
            "languages", t.getLanguages(),
            "availability", t.getAvailability()
        )).toList();
        return ResponseEntity.ok(safeTutors);
    }
    @Autowired
    private AdminService adminService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/tutors")
    public ResponseEntity<?> getAllTutors() {
        var tutors = adminService.getAllTutors();
        var safeTutors = tutors.stream().map(t -> java.util.Map.of(
            "id", t.getId(),
            "username", t.getUsername(),
            "email", t.getEmail(),
            "role", t.getRole(),
            "bio", t.getBio(),
            "subjects", t.getSubjects(),
            "languages", t.getLanguages(),
            "availability", t.getAvailability()
        )).toList();
        return ResponseEntity.ok(safeTutors);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        boolean created = adminService.createUser(user);
        if (!created) {
            return ResponseEntity.badRequest().body("{\"success\":false,\"message\":\"Email already exists\"}");
        }
        return ResponseEntity.ok("{\"success\":true}");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/edit-tutor/{id}")
    public ResponseEntity<?> editTutor(@PathVariable String id, @RequestBody User updatedTutor) {
        boolean updated = adminService.updateTutorProfile(id, updatedTutor);
        if (updated) {
            return ResponseEntity.ok("{\"success\":true}");
        } else {
            return ResponseEntity.badRequest().body("{\"success\":false,\"message\":\"Tutor not found or update failed\"}");
        }
    }
}
