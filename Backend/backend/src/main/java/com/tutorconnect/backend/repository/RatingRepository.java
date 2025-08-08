package com.tutorconnect.backend.repository;

import com.tutorconnect.backend.model.Rating;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface RatingRepository extends MongoRepository<Rating, String> {
    List<Rating> findByCourseId(String courseId);
    List<Rating> findByStudentId(String studentId);
}
