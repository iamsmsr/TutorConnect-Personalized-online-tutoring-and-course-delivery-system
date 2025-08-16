package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(User user) {
        // Use password field if available, otherwise fall back to passwordHash
        String rawPassword = user.getPassword() != null ? user.getPassword() : user.getPasswordHash();
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
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
    
    public java.util.Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public boolean checkPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
    
    // Search users by username, email, or ID (for chat functionality)
    public List<User> searchUsersByUsernameOrEmail(String query) {
        // Use a simple approach since we don't have complex search queries in UserRepository
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
            .filter(user -> 
                (user.getId() != null && user.getId().equals(query)) ||  // Exact ID match
                (user.getUsername() != null && user.getUsername().toLowerCase().contains(query.toLowerCase())) ||
                (user.getEmail() != null && user.getEmail().toLowerCase().contains(query.toLowerCase()))
            )
            .limit(20) // Limit results to prevent too many matches
            .toList();
    }
}