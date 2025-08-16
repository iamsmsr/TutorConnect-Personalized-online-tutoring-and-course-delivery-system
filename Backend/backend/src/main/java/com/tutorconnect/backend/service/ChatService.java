package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.Chat;
import com.tutorconnect.backend.model.Message;
import com.tutorconnect.backend.repository.ChatRepository;
import com.tutorconnect.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Arrays;

@Service
public class ChatService {
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private MessageRepository messageRepository;

    public List<Chat> getUserChats(String userId) {
        // Use String userId directly since Chat model stores userIds as strings
        List<Chat> chats = chatRepository.findByUserIdsContaining(userId);
        System.out.println("📋 Found " + chats.size() + " chats for user: " + userId);
        for (Chat chat : chats) {
            System.out.println("📋 Chat ID: " + chat.getId() + ", UserIds: " + chat.getUserIds());
        }
        return chats;
    }

    public List<Message> getChatMessages(String chatId) {
        return messageRepository.findByChatIdOrderByTimestampAsc(chatId);
    }

    // SECURE: Get chat messages with authorization
    public List<Message> getChatMessages(String chatId, String userId) {
        // First check if user is authorized to access this chat
        if (!isUserMemberOfChat(chatId, userId)) {
            throw new SecurityException("Access denied: User not authorized to view this chat");
        }
        return messageRepository.findByChatIdOrderByTimestampAsc(chatId);
    }

    public Chat createChat(String userId1, String userId2) {
        Chat chat = new Chat(Arrays.asList(userId1, userId2));
        return chatRepository.save(chat);
    }

    public Message sendMessage(String chatId, String senderId, String content) {
        Message message = new Message(chatId, senderId, null, content);
        return messageRepository.save(message);
    }

    // Save message (for already created message objects)
    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }

    // SECURE: Send message with authorization
    public Message sendMessage(String chatId, String senderId, String content, String authenticatedUserId) {
        // First check if user is authorized to send message to this chat
        if (!isUserMemberOfChat(chatId, authenticatedUserId)) {
            throw new SecurityException("Access denied: User not authorized to send messages to this chat");
        }
        
        // Additional check: senderId should match authenticated user
        if (!senderId.equals(authenticatedUserId)) {
            throw new SecurityException("Access denied: Cannot send message as different user");
        }
        
        Message message = new Message(chatId, senderId, null, content);
        return messageRepository.save(message);
    }

    // Security helper method: Check if user is member of chat
    public boolean isUserMemberOfChat(String chatId, String userId) {
        try {
            Chat chat = chatRepository.findById(chatId).orElse(null);
            if (chat == null) {
                return false;
            }
            return chat.getUserIds().contains(userId);
        } catch (Exception e) {
            return false;
        }
    }

    // This method to check if chat exists between two users
    public Chat findChatBetweenUsers(String userId1, String userId2) {
        // Use the custom repository method for exact match
        List<Chat> existingChats = chatRepository.findChatBetweenUsers(userId1, userId2);
        if (!existingChats.isEmpty()) {
            System.out.println("🔍 Found existing chat between " + userId1 + " and " + userId2 + ": " + existingChats.get(0).getId());
            return existingChats.get(0);
        }
        
        // Fallback: search manually
        List<Chat> allChats = chatRepository.findByUserIdsContaining(userId1);
        System.out.println("🔍 Searching through " + allChats.size() + " chats for user " + userId1);
        
        for (Chat chat : allChats) {
            System.out.println("🔍 Checking chat " + chat.getId() + " with users: " + chat.getUserIds());
            if (chat.getUserIds().contains(userId1) && chat.getUserIds().contains(userId2)) {
                System.out.println("🔍 Found matching chat: " + chat.getId());
                return chat;
            }
        }
        System.out.println("🔍 No existing chat found between " + userId1 + " and " + userId2);
        return null;
    }

    // Add this method to create or get existing chat
    public Chat createOrGetChat(String userId1, String userId2) {
        System.out.println("🚀 Creating or getting chat between " + userId1 + " and " + userId2);
        
        Chat existingChat = findChatBetweenUsers(userId1, userId2);
        if (existingChat != null) {
            System.out.println("🚀 Returning existing chat: " + existingChat.getId());
            return existingChat;
        }
        
        System.out.println("🚀 Creating new chat between " + userId1 + " and " + userId2);
        Chat newChat = createChat(userId1, userId2);
        System.out.println("🚀 Created new chat with ID: " + newChat.getId());
        return newChat;
    }
}
