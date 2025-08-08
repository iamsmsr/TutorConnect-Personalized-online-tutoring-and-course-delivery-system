package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.Course;
import com.tutorconnect.backend.service.CourseService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
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
