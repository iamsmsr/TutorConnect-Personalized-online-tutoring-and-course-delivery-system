package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.Course;
import com.tutorconnect.backend.repository.CourseRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CourseService {
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }
    public void saveCourse(Course course) {
        courseRepository.save(course);
    }
    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<Course> searchCoursesByTitle(String query) {
        return courseRepository.findByTitleContainingIgnoreCase(query);
    }

    public Course getCourseById(String id) {
        return courseRepository.findById(id).orElse(null);
    }
}
