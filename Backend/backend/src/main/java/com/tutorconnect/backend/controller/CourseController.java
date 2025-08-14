package com.tutorconnect.backend.controller;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.ArrayList;


import com.tutorconnect.backend.model.Course;
import com.tutorconnect.backend.service.CourseService;
import org.springframework.web.bind.annotation.*;
import java.util.List;


import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.ArrayList;
import com.tutorconnect.backend.model.Course;
import com.tutorconnect.backend.service.CourseService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/progress/video")
    public ResponseEntity<?> markVideoProgress(@PathVariable String id, @RequestBody Map<String, String> body) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String studentEmail = principal instanceof String ? (String) principal : null;
        if (studentEmail == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }
        Course course = courseService.getCourseById(id);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());
        // Find or create student entry
        Map<String, Object> studentObj = null;
        int studentIdx = -1;
        for (int i = 0; i < students.size(); i++) {
            Map<String, Object> s = students.get(i);
            if (studentEmail.equalsIgnoreCase((String)s.get("email"))) {
                studentObj = s;
                studentIdx = i;
                break;
            }
        }
        if (studentObj == null) {
            studentObj = new java.util.HashMap<>();
            studentObj.put("email", studentEmail);
        }
        // Get total videos
        ArrayList<Object> videoArr = (ArrayList<Object>) extra.getOrDefault("video", new ArrayList<>());
        int totalVideos = videoArr.size();
        int watched = studentObj.get("progress") instanceof Integer ? (Integer) studentObj.get("progress") : 0;
        if (watched < totalVideos) {
            watched++;
        }
        int progressPercent = totalVideos > 0 ? (int) ((watched * 100.0) / totalVideos) : 0;
        studentObj.put("progress", watched);
        studentObj.put("progressPercent", progressPercent);
        // Replace or add studentObj in students array
        if (studentIdx >= 0) {
            students.set(studentIdx, studentObj);
        } else {
            students.add(studentObj);
        }
        extra.put("students", students);
        course.setExtra(extra);
        courseService.saveCourse(course);
        return ResponseEntity.ok(Map.of("success", true, "progress", watched, "progressPercent", progressPercent));
    }
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/enrolled")
    public ResponseEntity<?> getEnrolledCourses() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String studentEmail = principal instanceof String ? (String) principal : null;
        if (studentEmail == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("success", false, "message", "Unauthorized"));
        }
        List<Course> allCourses = courseService.getAllCourses();
        List<Course> enrolledCourses = new java.util.ArrayList<>();
        for (Course course : allCourses) {
            Object extraObj = course.getExtra();
            if (extraObj instanceof java.util.Map) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> extra = (java.util.Map<String, Object>) extraObj;
                Object studentsObj = extra.get("students");
                if (studentsObj instanceof java.util.List) {
                    @SuppressWarnings("unchecked")
                    java.util.List<java.util.Map<String, String>> students = (java.util.List<java.util.Map<String, String>>) studentsObj;
                    for (java.util.Map<String, String> s : students) {
                        String email = s.get("email");
                        if (studentEmail.equalsIgnoreCase(email)) {
                            enrolledCourses.add(course);
                            break;
                        }
                    }
                }
            }
        }
        return ResponseEntity.ok(enrolledCourses);
    }
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enrollInCourse(@PathVariable String id) {
        // Get student email from JWT principal
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String studentEmail = principal instanceof String ? (String) principal : null;
        if (studentEmail == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }
        Course course = courseService.getCourseById(id);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }
        // Get or create students array in extra
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        ArrayList<Map<String, String>> students = (ArrayList<Map<String, String>>) extra.getOrDefault("students", new ArrayList<>());
        boolean alreadyEnrolled = students.stream().anyMatch(s -> studentEmail.equalsIgnoreCase(s.get("email")));
        if (alreadyEnrolled) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Already enrolled"));
        }
        Map<String, String> studentObj = new java.util.HashMap<>();
        studentObj.put("email", studentEmail);
        students.add(studentObj);
        extra.put("students", students);
        course.setExtra(extra);
        courseService.saveCourse(course);
        return ResponseEntity.ok(Map.of("success", true));
    }
    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/search")
    public List<Course> searchCourses(@RequestParam String query) {
        return courseService.searchCoursesByTitle(query);
    }

    @GetMapping("/{id}")
    public Course getCourseById(@PathVariable String id) {
        return courseService.getCourseById(id);
    }
}
