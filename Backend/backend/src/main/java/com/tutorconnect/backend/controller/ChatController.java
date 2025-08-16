package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.Chat;
import com.tutorconnect.backend.service.ChatService;
import com.tutorconnect.backend.service.UserService;
import com.tutorconnect.backend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserService userService;

    // Get all chats for the authenticated user
    @GetMapping("/my")
    public List<Chat> getMyChats(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found");
        }
        User user = userOpt.get();
        System.out.println("🎯 Getting chats for user: " + user.getId() + " (" + email + ")");
        
        List<Chat> chats = chatService.getUserChats(user.getId());
        System.out.println("🎯 Returning " + chats.size() + " chats to frontend");
        
        return chats;
    }

    // Create a new chat between two users
    @PostMapping("/create")
    public ResponseEntity<?> createChat(@RequestBody CreateChatRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            User currentUser = userOpt.get();
            
            System.out.println("💬 Creating chat with: " + request.getOtherUserEmail());
            
            // Find the other user
            Optional<User> otherUserOpt = userService.findByEmail(request.getOtherUserEmail());
            if (!otherUserOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found: " + request.getOtherUserEmail());
                return ResponseEntity.badRequest().body(error);
            }
            User otherUser = otherUserOpt.get();
            
            // Create or get existing chat
            Chat chat = chatService.createOrGetChat(currentUser.getId(), otherUser.getId());
            
            System.out.println("💬 Chat created/found with ID: " + chat.getId());
            return ResponseEntity.ok(chat);
            
        } catch (Exception e) {
            System.err.println("❌ Error creating chat: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error creating chat: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Get messages for a chat
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getChatMessages(@PathVariable String chatId, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (!userOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            User user = userOpt.get();
            
            // Check if user is authorized to access this chat
            if (!chatService.isUserMemberOfChat(chatId, user.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Access denied: User not authorized to view this chat");
                return ResponseEntity.status(403).body(error);
            }
            
            var messages = chatService.getChatMessages(chatId);
            return ResponseEntity.ok(messages);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching messages");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Request classes
    public static class CreateChatRequest {
        private String otherUserEmail;
        
        public String getOtherUserEmail() { return otherUserEmail; }
        public void setOtherUserEmail(String otherUserEmail) { this.otherUserEmail = otherUserEmail; }
    }
}
