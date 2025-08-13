package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AdminService {
    public void saveCourse(com.tutorconnect.backend.model.Course course) {
        courseRepository.save(course);
    }
    @Autowired
    private com.tutorconnect.backend.repository.CourseRepository courseRepository;

    public boolean createCourse(com.tutorconnect.backend.model.Course course) {
        courseRepository.save(course);
        return true;
    }

    public boolean editCourse(String id, com.tutorconnect.backend.model.Course updatedCourse) {
        Optional<com.tutorconnect.backend.model.Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isPresent()) {
            com.tutorconnect.backend.model.Course course = courseOpt.get();
            course.setTitle(updatedCourse.getTitle());
            course.setDescription(updatedCourse.getDescription());
            course.setTutorId(updatedCourse.getTutorId());
            course.setSubjects(updatedCourse.getSubjects());
            course.setLanguage(updatedCourse.getLanguage());
            course.setPrice(updatedCourse.getPrice());
            course.setDuration(updatedCourse.getDuration());
            course.setStudentsEnrolled(updatedCourse.getStudentsEnrolled());
            course.setExtra(updatedCourse.getExtra());
            courseRepository.save(course);
            return true;
        }
        return false;
    }

    public java.util.List<com.tutorconnect.backend.model.Course> searchCourses(String query) {
        // Search by title, subject, or tutorId
        var byTitle = courseRepository.findByTitleContainingIgnoreCase(query);
        var bySubject = courseRepository.findBySubjectsContainingIgnoreCase(query);
        var byTutor = courseRepository.findByTutorId(query);
        var all = new java.util.HashSet<com.tutorconnect.backend.model.Course>();
        all.addAll(byTitle);
        all.addAll(bySubject);
        all.addAll(byTutor);
        return new java.util.ArrayList<>(all);
    }

    public java.util.List<com.tutorconnect.backend.model.Course> getAllCourses() {
        return courseRepository.findAll();
    }
    public java.util.List<User> searchTutors(String query) {
        return userRepository.findAll().stream()
            .filter(u -> "TUTOR".equals(u.getRole()) &&
                (u.getUsername().toLowerCase().contains(query.toLowerCase()) ||
                 u.getEmail().toLowerCase().contains(query.toLowerCase())))
            .toList();
    }
    public java.util.List<User> getAllTutors() {
        return userRepository.findAll().stream()
            .filter(u -> "TUTOR".equals(u.getRole()))
            .toList();
    }
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public boolean createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return false;
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        userRepository.save(user);
        return true;
    }

    public boolean updateTutorProfile(String id, User updatedTutor) {
        Optional<User> tutorOpt = userRepository.findById(id);
        if (tutorOpt.isPresent() && "TUTOR".equals(tutorOpt.get().getRole())) {
            User tutor = tutorOpt.get();
            tutor.setUsername(updatedTutor.getUsername());
            tutor.setEmail(updatedTutor.getEmail());
            tutor.setBio(updatedTutor.getBio());
            tutor.setSubjects(updatedTutor.getSubjects());
            tutor.setLanguages(updatedTutor.getLanguages());
            tutor.setAvailability(updatedTutor.getAvailability());
            userRepository.save(tutor);
            return true;
        }
        return false;
    }
}
