package com.tutorconnect.backend.controller;

import com.tutorconnect.backend.model.Message;
import com.tutorconnect.backend.service.ChatService;
import com.tutorconnect.backend.service.GroupChatService;
import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.Optional;

@Controller
public class WebSocketChatController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private GroupChatService groupChatService;
    
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload Map<String, Object> messageData) {
        try {
            System.out.println("📨 WebSocket message received: " + messageData);
            
            String chatId = (String) messageData.get("chatId");
            String senderId = (String) messageData.get("senderId");
            String content = (String) messageData.get("content");
            String messageType = (String) messageData.get("messageType"); // "INDIVIDUAL" or "GROUP"
            
            if (chatId == null || senderId == null || content == null) {
                System.err.println("❌ Missing required fields in message");
                return;
            }
            
            // Default to individual chat if messageType not specified
            if (messageType == null) {
                messageType = "INDIVIDUAL";
            }
            
            // Get sender info - handle both ID and email
            Optional<User> senderOpt;
            String actualSenderId;
            String senderName = "Unknown User";
            
            // First try to find by ID
            senderOpt = userService.findById(senderId);
            if (senderOpt.isPresent()) {
                User sender = senderOpt.get();
                senderName = sender.getUsername() != null ? sender.getUsername() : sender.getEmail();
                actualSenderId = sender.getId();
                System.out.println("✅ Sender found by ID: " + senderName + " (" + actualSenderId + ")");
            } else {
                // Fallback: try to find by email
                senderOpt = userService.findByEmail(senderId);
                if (senderOpt.isPresent()) {
                    User sender = senderOpt.get();
                    senderName = sender.getUsername() != null ? sender.getUsername() : sender.getEmail();
                    actualSenderId = sender.getId();
                    System.out.println("✅ Sender found by email: " + senderName + " (" + actualSenderId + ")");
                } else {
                    System.err.println("⚠️ Sender not found: " + senderId);
                    actualSenderId = senderId;
                    senderName = "User-" + senderId.substring(Math.max(0, senderId.length() - 4));
                }
            }
            
            Message savedMessage;
            
            // Handle different message types
            if ("GROUP".equals(messageType)) {
                // Verify user is member of group chat
                if (!groupChatService.isUserMemberOfGroupChat(chatId, actualSenderId)) {
                    System.err.println("❌ User not authorized to send to group chat: " + chatId);
                    return;
                }
                
                // Save group message
                savedMessage = Message.createGroupMessage(chatId, actualSenderId, content);
                savedMessage = chatService.saveMessage(savedMessage);
                System.out.println("✅ Group message saved: " + savedMessage.getId());
            } else {
                // Save individual message
                savedMessage = chatService.sendMessage(chatId, actualSenderId, content);
                System.out.println("✅ Individual message saved: " + savedMessage.getId());
            }
            
            // Create response with all needed data
            Map<String, Object> response = Map.of(
                "id", savedMessage.getId(),
                "chatId", chatId,
                "senderId", actualSenderId,
                "senderName", senderName,
                "content", content,
                "messageType", messageType,
                "timestamp", savedMessage.getTimestamp().toString()
            );
            
            // Broadcast to all users in the chat
            messagingTemplate.convertAndSend("/topic/chat/" + chatId, response);
            System.out.println("✅ Message broadcasted to chat: " + chatId + " (Type: " + messageType + ")");
            
        } catch (Exception e) {
            System.err.println("❌ Error handling message: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @MessageMapping("/joinChat")
    public void joinChat(@Payload Map<String, Object> joinData) {
        try {
            String chatId = (String) joinData.get("chatId");
            String userId = (String) joinData.get("userId");
            String chatType = (String) joinData.get("chatType"); // "INDIVIDUAL" or "GROUP"
            
            if (chatId == null || userId == null) {
                System.err.println("❌ Missing chatId or userId in join request");
                return;
            }
            
            // Default to individual chat if chatType not specified
            if (chatType == null) {
                chatType = "INDIVIDUAL";
            }
            
            Optional<User> userOpt = userService.findByEmail(userId);
            if (!userOpt.isPresent()) {
                System.err.println("❌ User not found: " + userId);
                return;
            }
            User user = userOpt.get();
            
            // Verify authorization for group chats
            if ("GROUP".equals(chatType)) {
                if (!groupChatService.isUserMemberOfGroupChat(chatId, user.getId())) {
                    System.err.println("❌ User not authorized to join group chat: " + chatId);
                    return;
                }
            }
            
            // Send join notification
            Map<String, Object> joinNotification = Map.of(
                "type", "JOIN",
                "chatId", chatId,
                "userId", user.getId(),
                "userName", user.getUsername(),
                "chatType", chatType,
                "message", user.getUsername() + " joined the chat"
            );
            
            messagingTemplate.convertAndSend("/topic/chat/" + chatId, joinNotification);
            System.out.println("✅ User joined: " + user.getUsername() + " -> " + chatId + " (Type: " + chatType + ")");
            
        } catch (Exception e) {
            System.err.println("❌ Error handling join: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
