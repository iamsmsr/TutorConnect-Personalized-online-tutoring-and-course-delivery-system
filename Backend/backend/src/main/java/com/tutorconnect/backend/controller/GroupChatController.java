package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.GroupChat;
import com.tutorconnect.backend.model.Message;
import com.tutorconnect.backend.service.GroupChatService;
import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/groupchat")
public class GroupChatController {
    
    @Autowired
    private GroupChatService groupChatService;
    
    @Autowired
    private UserService userService;

    // Get all group chats for the authenticated user
    @GetMapping("/my")
    public List<GroupChat> getMyGroupChats(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found");
        }
        User user = userOpt.get();
        System.out.println("🎯 Getting group chats for user: " + user.getId() + " (" + email + ")");
        
        List<GroupChat> groupChats = groupChatService.getUserGroupChats(user.getId());
        System.out.println("🎯 Returning " + groupChats.size() + " group chats to frontend");
        
        return groupChats;
    }

    // Create a new group chat
    @PostMapping("/create")
    public ResponseEntity<?> createGroupChat(@RequestBody CreateGroupChatRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            User creator = userOpt.get();
            
            System.out.println("💬 Creating group chat: " + request.getName());
            
            GroupChat groupChat = groupChatService.createGroupChat(
                request.getName(), 
                request.getDescription(), 
                request.getParticipantEmails(), 
                creator.getId()
            );
            
            System.out.println("💬 Group chat created with ID: " + groupChat.getId());
            return ResponseEntity.ok(groupChat);
            
        } catch (Exception e) {
            System.err.println("❌ Error creating group chat: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error creating group chat: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Get messages for a group chat
    @GetMapping("/{groupChatId}/messages")
    public ResponseEntity<?> getGroupChatMessages(@PathVariable String groupChatId, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            User user = userOpt.get();
            
            // Check if user is authorized to access this group chat
            if (!groupChatService.isUserMemberOfGroupChat(groupChatId, user.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Access denied: User not authorized to view this group chat");
                return ResponseEntity.status(403).body(error);
            }
            
            List<Message> messages = groupChatService.getGroupChatMessages(groupChatId);
            return ResponseEntity.ok(messages);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching group messages");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Add participant to group chat
    @PostMapping("/{groupChatId}/participants")
    public ResponseEntity<?> addParticipant(@PathVariable String groupChatId, @RequestBody AddParticipantRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            User user = userOpt.get();
            
            GroupChat updatedGroup = groupChatService.addParticipant(groupChatId, request.getUserEmail(), user.getId());
            return ResponseEntity.ok(updatedGroup);
            
        } catch (SecurityException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error adding participant");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Remove participant from group chat
    @DeleteMapping("/{groupChatId}/participants/{participantEmail}")
    public ResponseEntity<?> removeParticipant(@PathVariable String groupChatId, @PathVariable String participantEmail, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            User user = userOpt.get();
            
            GroupChat updatedGroup = groupChatService.removeParticipant(groupChatId, participantEmail, user.getId());
            return ResponseEntity.ok(updatedGroup);
            
        } catch (SecurityException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error removing participant");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Request classes
    public static class CreateGroupChatRequest {
        private String name;
        private String description;
        private List<String> participantEmails;
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public List<String> getParticipantEmails() { return participantEmails; }
        public void setParticipantEmails(List<String> participantEmails) { this.participantEmails = participantEmails; }
    }

    public static class AddParticipantRequest {
        private String userEmail;
        
        public String getUserEmail() { return userEmail; }
        public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    }
}
