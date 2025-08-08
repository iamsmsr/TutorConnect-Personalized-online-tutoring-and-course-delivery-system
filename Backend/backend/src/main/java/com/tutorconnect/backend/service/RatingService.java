package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.Rating;
import com.tutorconnect.backend.repository.RatingRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RatingService {
    private final RatingRepository ratingRepository;

    public RatingService(RatingRepository ratingRepository) {
        this.ratingRepository = ratingRepository;
    }

    public Rating addRating(Rating rating) {
        return ratingRepository.save(rating);
    }

    public List<Rating> getRatingsByCourseId(String courseId) {
        return ratingRepository.findByCourseId(courseId);
    }

    public double getAverageRatingForCourse(String courseId) {
        List<Rating> ratings = ratingRepository.findByCourseId(courseId);
        if (ratings.isEmpty()) return 0.0;
        return ratings.stream().mapToInt(Rating::getStars).average().orElse(0.0);
    }
}
