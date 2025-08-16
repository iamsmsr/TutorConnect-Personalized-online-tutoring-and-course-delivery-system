package com.tutorconnect.backend.controller;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.ArrayList;
import java.time.Instant;
import java.util.UUID;

import com.tutorconnect.backend.model.Course;
import com.tutorconnect.backend.service.CourseService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    @PreAuthorize("hasRole('TUTOR')")
    @PutMapping("/{courseId}/students/{studentEmail}/assignments")
    public ResponseEntity<?> markAssignmentDone(@PathVariable String courseId, @PathVariable String studentEmail, @RequestBody Map<String, String> body) {
        String assignmentTitle = body.get("assignmentTitle");
        if (assignmentTitle == null || assignmentTitle.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing assignment title"));
        }
        Course course = courseService.getCourseById(courseId);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());
        ArrayList<Object> assignmentsArr = (ArrayList<Object>) extra.getOrDefault("assignments", new ArrayList<>());
        int totalAssignments = assignmentsArr.size();
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
        ArrayList<String> assignmentsDone = studentObj.get("assignmentsDone") instanceof ArrayList ? (ArrayList<String>) studentObj.get("assignmentsDone") : new ArrayList<>();
        if (!assignmentsDone.contains(assignmentTitle)) {
            assignmentsDone.add(assignmentTitle);
        }
        int doneCount = assignmentsDone.size();
        int progressPercent = totalAssignments > 0 ? (int) ((doneCount * 100.0) / totalAssignments) : 0;
        studentObj.put("assignmentsDone", assignmentsDone);
        studentObj.put("assignmentProgress", doneCount);
        studentObj.put("assignmentProgressPercent", progressPercent);
        if (studentIdx >= 0) {
            students.set(studentIdx, studentObj);
        } else {
            students.add(studentObj);
        }
        extra.put("students", students);
        course.setExtra(extra);
        courseService.saveCourse(course);
        return ResponseEntity.ok(Map.of("success", true, "doneCount", doneCount, "progressPercent", progressPercent));
    }
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

    // Session Request Endpoints
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{courseId}/session-request")
    public ResponseEntity<?> createSessionRequest(@PathVariable String courseId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String studentEmail = principal instanceof String ? (String) principal : null;
        if (studentEmail == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        Course course = courseService.getCourseById(courseId);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());

        // Find student
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
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Not enrolled in this course"));
        }

        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> requests = studentObj.get("requests") instanceof ArrayList ? 
            (ArrayList<Map<String, Object>>) studentObj.get("requests") : new ArrayList<>();

        // Check if student has reached 5 request limit (total requests, not just pending)
        if (requests.size() >= 5) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Maximum 5 requests allowed per course"));
        }

        // Create new request
        Map<String, Object> request = new java.util.HashMap<>();
        request.put("id", UUID.randomUUID().toString());
        request.put("status", "pending");
        request.put("requestedAt", Instant.now().toString());
        request.put("studentEmail", studentEmail);

        requests.add(request);
        studentObj.put("requests", requests);
        students.set(studentIdx, studentObj);
        extra.put("students", students);
        course.setExtra(extra);
        courseService.saveCourse(course);

        return ResponseEntity.ok(Map.of("success", true, "requestId", request.get("id")));
    }

    // Extra Session Request Endpoint
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{courseId}/extra-session-request")
    public ResponseEntity<?> createExtraSessionRequest(@PathVariable String courseId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String studentEmail = principal instanceof String ? (String) principal : null;
        if (studentEmail == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        Course course = courseService.getCourseById(courseId);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());

        // Find student
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
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Not enrolled in this course"));
        }

        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> requests = studentObj.get("requests") instanceof ArrayList ? 
            (ArrayList<Map<String, Object>>) studentObj.get("requests") : new ArrayList<>();

        // Create new extra request
        Map<String, Object> request = new java.util.HashMap<>();
        request.put("id", UUID.randomUUID().toString());
        request.put("status", "pending");
        request.put("requestedAt", Instant.now().toString());
        request.put("studentEmail", studentEmail);
        request.put("isExtra", true); // Mark as extra request

        requests.add(request);
        studentObj.put("requests", requests);
        students.set(studentIdx, studentObj);
        extra.put("students", students);
        course.setExtra(extra);
        courseService.saveCourse(course);

        return ResponseEntity.ok(Map.of("success", true, "requestId", request.get("id"), "isExtra", true));
    }

    @PreAuthorize("hasRole('TUTOR')")
    @PutMapping("/{courseId}/session-request/{requestId}/respond")
    public ResponseEntity<?> respondToSessionRequest(@PathVariable String courseId, @PathVariable String requestId, @RequestBody Map<String, Object> body) {
        Course course = courseService.getCourseById(courseId);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());

        // Find the request
        boolean requestFound = false;
        for (Map<String, Object> student : students) {
            @SuppressWarnings("unchecked")
            ArrayList<Map<String, Object>> requests = student.get("requests") instanceof ArrayList ? 
                (ArrayList<Map<String, Object>>) student.get("requests") : new ArrayList<>();
            
            for (Map<String, Object> request : requests) {
                if (requestId.equals(request.get("id")) && "pending".equals(request.get("status"))) {
                    String status = (String) body.get("status");
                    String comment = (String) body.get("comment");
                    request.put("status", status);
                    request.put("responseAt", Instant.now().toString());
                    
                    if (comment != null && !comment.trim().isEmpty()) {
                        request.put("comment", comment.trim());
                    }
                    
                    if ("accepted".equals(status)) {
                        String jitsiLink = (String) body.get("jitsiLink");
                        String scheduledTime = (String) body.get("scheduledTime");
                        if (jitsiLink != null) request.put("jitsiLink", jitsiLink);
                        if (scheduledTime != null) request.put("scheduledTime", scheduledTime);
                    }
                    
                    requestFound = true;
                    break;
                }
            }
            if (requestFound) break;
        }

        if (!requestFound) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Request not found or already processed"));
        }

        course.setExtra(extra);
        courseService.saveCourse(course);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/{courseId}/student-requests")
    public ResponseEntity<?> getStudentRequests(@PathVariable String courseId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String studentEmail = principal instanceof String ? (String) principal : null;
        if (studentEmail == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        Course course = courseService.getCourseById(courseId);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());

        // Find student and their requests
        for (Map<String, Object> student : students) {
            if (studentEmail.equalsIgnoreCase((String)student.get("email"))) {
                @SuppressWarnings("unchecked")
                ArrayList<Map<String, Object>> requests = student.get("requests") instanceof ArrayList ? 
                    (ArrayList<Map<String, Object>>) student.get("requests") : new ArrayList<>();

                // Update expired sessions to "done"
                for (Map<String, Object> request : requests) {
                    if ("accepted".equals(request.get("status")) && request.get("scheduledTime") != null) {
                        try {
                            Instant scheduledTime = Instant.parse((String) request.get("scheduledTime"));
                            if (Instant.now().isAfter(scheduledTime)) {
                                request.put("status", "done");
                            }
                        } catch (Exception e) {
                            // Ignore parse errors
                        }
                    }
                }

                course.setExtra(extra);
                courseService.saveCourse(course);
                return ResponseEntity.ok(Map.of("success", true, "requests", requests));
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "requests", new ArrayList<>()));
    }

    @PreAuthorize("hasRole('TUTOR')")
    @GetMapping("/{courseId}/tutor-requests")
    public ResponseEntity<?> getCourseRequests(@PathVariable String courseId) {
        Course course = courseService.getCourseById(courseId);
        if (course == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Course not found"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> extra = course.getExtra() instanceof Map ? (Map<String, Object>) course.getExtra() : new java.util.HashMap<>();
        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> students = (ArrayList<Map<String, Object>>) extra.getOrDefault("students", new ArrayList<>());

        ArrayList<Map<String, Object>> allRequests = new ArrayList<>();
        
        // Collect all requests from all students
        for (Map<String, Object> student : students) {
            @SuppressWarnings("unchecked")
            ArrayList<Map<String, Object>> requests = student.get("requests") instanceof ArrayList ? 
                (ArrayList<Map<String, Object>>) student.get("requests") : new ArrayList<>();
            
            // Update expired sessions to "done"
            for (Map<String, Object> request : requests) {
                if ("accepted".equals(request.get("status")) && request.get("scheduledTime") != null) {
                    try {
                        Instant scheduledTime = Instant.parse((String) request.get("scheduledTime"));
                        if (Instant.now().isAfter(scheduledTime)) {
                            request.put("status", "done");
                        }
                    } catch (Exception e) {
                        // Ignore parse errors
                    }
                }
                allRequests.add(request);
            }
        }

        course.setExtra(extra);
        courseService.saveCourse(course);
        return ResponseEntity.ok(Map.of("success", true, "requests", allRequests));
    }
}
