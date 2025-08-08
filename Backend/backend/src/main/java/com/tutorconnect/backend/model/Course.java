package com.tutorconnect.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.time.Instant;

@Document(collection = "Courses")
public class Course {
    @Id
    private String id;
    private String title;
    private String description;
    private String tutorId;
    private List<String> subjects;
    private String language;
    private double price;
    private String duration;
    private int studentsEnrolled;
    private Instant createdAt = Instant.now();
    private List<Object> extra;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTutorId() { return tutorId; }
    public void setTutorId(String tutorId) { this.tutorId = tutorId; }
    public List<String> getSubjects() { return subjects; }
    public void setSubjects(List<String> subjects) { this.subjects = subjects; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public int getStudentsEnrolled() { return studentsEnrolled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setStudentsEnrolled(int studentsEnrolled) { this.studentsEnrolled = studentsEnrolled; }
    public List<Object> getExtra() { return extra; }
    public void setExtra(List<Object> extra) { this.extra = extra; }
}
