package com.tutorconnect.backend.repository;

import com.tutorconnect.backend.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CourseRepository extends MongoRepository<Course, String> {
    List<Course> findByTitleContainingIgnoreCase(String title);
    List<Course> findBySubjectsContainingIgnoreCase(String subject);
    List<Course> findByTutorId(String tutorId);
}
