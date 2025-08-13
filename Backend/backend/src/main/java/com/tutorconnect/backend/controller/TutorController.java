
package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.HashMap;

@RestController
@RequestMapping("/api/tutor")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class TutorController {
    @Autowired
    private AdminService adminService;

    @PreAuthorize("hasRole('TUTOR')")
    @GetMapping("/courses")
    public ResponseEntity<?> getAssignedCourses(@AuthenticationPrincipal String email) {
        String tutorEmail = email;
        if (tutorEmail == null) {
            // Fallback: get from SecurityContext
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            tutorEmail = principal instanceof String ? (String) principal : null;
        }
        var courses = adminService.getAllCourses();
        final String finalTutorEmail = tutorEmail;
        var assignedCourses = courses.stream()
            .filter(c -> finalTutorEmail != null && finalTutorEmail.equalsIgnoreCase(c.getTutorId()))
            .map(c -> {
                var map = new HashMap<String, Object>();
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
        return ResponseEntity.ok(assignedCourses);
    }
    @PreAuthorize("hasRole('TUTOR')")
    @PutMapping("/courses/{courseId}/resources")
    public ResponseEntity<?> updateCourseResources(
        @PathVariable String courseId,
        @RequestBody java.util.Map<String, Object> resources,
        @AuthenticationPrincipal String email
    ) {
        String tutorEmail = email;
        if (tutorEmail == null) {
            Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            tutorEmail = principal instanceof String ? (String) principal : null;
        }
        var courseOpt = adminService.getAllCourses().stream()
            .filter(c -> c.getId().equals(courseId))
            .findFirst();
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of("success", false, "message", "Course not found"));
        }
        var course = courseOpt.get();
        if (tutorEmail == null || !tutorEmail.equalsIgnoreCase(course.getTutorId())) {
            return ResponseEntity.status(403).body(java.util.Map.of("success", false, "message", "Not authorized"));
        }
        // Accept quizzes as part of resources: quizzes should be a List<Map<String, Object>>
        // Example quiz: { "question": "...", "options": ["A", "B", "C"], "answer": "A" }
        course.setExtra(resources);
        adminService.saveCourse(course);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }
}
