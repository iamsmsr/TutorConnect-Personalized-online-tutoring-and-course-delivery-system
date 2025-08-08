package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.repository.UserRepository;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(User user) {
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        if (user.getBio() == null) user.setBio("");
        if (user.getSubjects() == null) user.setSubjects(new ArrayList<>());
        if (user.getLanguages() == null) user.setLanguages(new ArrayList<>());
        if (user.getAvailability() == null) user.setAvailability("");
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public java.util.Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean checkPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
}