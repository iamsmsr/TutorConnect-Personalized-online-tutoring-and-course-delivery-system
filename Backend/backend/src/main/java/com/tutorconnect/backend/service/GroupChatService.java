package com.tutorconnect.backend.service;

import com.tutorconnect.backend.model.GroupChat;
import com.tutorconnect.backend.model.Message;
import com.tutorconnect.backend.repository.GroupChatRepository;
import com.tutorconnect.backend.repository.MessageRepository;
import com.tutorconnect.backend.model.User;
import com.tutorconnect.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GroupChatService {
    
    @Autowired
    private GroupChatRepository groupChatRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserService userService;

    // Get all group chats for a user
    public List<GroupChat> getUserGroupChats(String userId) {
        return groupChatRepository.findByParticipantIdsContaining(userId);
    }

    // Create a new group chat
    public GroupChat createGroupChat(String name, String description, List<String> participantEmails, String createdBy) {
        System.out.println("🏗️ Creating group chat: " + name);
        
        // Resolve participant emails to user IDs
        List<String> participantIds = new ArrayList<>();
        
        // Add creator to participants
        participantIds.add(createdBy);
        
        // Add other participants
        for (String email : participantEmails) {
            try {
                Optional<User> participantOpt = userService.findByEmail(email);
                if (participantOpt.isPresent()) {
                    User participant = participantOpt.get();
                    if (!participantIds.contains(participant.getId())) {
                        participantIds.add(participant.getId());
                        System.out.println("🏗️ Added participant: " + email + " (ID: " + participant.getId() + ")");
                    }
                } else {
                    System.out.println("⚠️ User not found: " + email);
                }
            } catch (Exception e) {
                System.err.println("❌ Error finding user: " + email + " - " + e.getMessage());
            }
        }
        
        // Create group chat
        GroupChat groupChat = new GroupChat(name, description, participantIds, createdBy);
        GroupChat savedGroup = groupChatRepository.save(groupChat);
        
        System.out.println("✅ Group chat created with " + participantIds.size() + " participants");
        return savedGroup;
    }

    // Get messages for a group chat
    public List<Message> getGroupChatMessages(String groupChatId) {
        return messageRepository.findByGroupChatIdOrderByTimestampAsc(groupChatId);
    }

    // Check if user is member of group chat
    public boolean isUserMemberOfGroupChat(String groupChatId, String userId) {
        Optional<GroupChat> groupChatOpt = groupChatRepository.findById(groupChatId);
        if (groupChatOpt.isPresent()) {
            GroupChat groupChat = groupChatOpt.get();
            return groupChat.getParticipantIds().contains(userId);
        }
        return false;
    }

    // Add participant to group chat
    public GroupChat addParticipant(String groupChatId, String userEmail, String requestingUserId) {
        Optional<GroupChat> groupChatOpt = groupChatRepository.findById(groupChatId);
        if (!groupChatOpt.isPresent()) {
            throw new RuntimeException("Group chat not found");
        }
        
        GroupChat groupChat = groupChatOpt.get();
        
        // Check if requesting user is creator or admin (for now only creator can add)
        if (!groupChat.getCreatedBy().equals(requestingUserId)) {
            throw new SecurityException("Only group creator can add participants");
        }
        
        // Find user to add
        Optional<User> userToAddOpt = userService.findByEmail(userEmail);
        if (!userToAddOpt.isPresent()) {
            throw new RuntimeException("User not found: " + userEmail);
        }
        User userToAdd = userToAddOpt.get();
        
        // Check if user is already a participant
        if (groupChat.getParticipantIds().contains(userToAdd.getId())) {
            throw new RuntimeException("User is already a participant");
        }
        
        // Add participant
        groupChat.getParticipantIds().add(userToAdd.getId());
        return groupChatRepository.save(groupChat);
    }

    // Remove participant from group chat
    public GroupChat removeParticipant(String groupChatId, String userEmail, String requestingUserId) {
        Optional<GroupChat> groupChatOpt = groupChatRepository.findById(groupChatId);
        if (!groupChatOpt.isPresent()) {
            throw new RuntimeException("Group chat not found");
        }
        
        GroupChat groupChat = groupChatOpt.get();
        
        // Check if requesting user is creator or the user themselves
        Optional<User> userToRemoveOpt = userService.findByEmail(userEmail);
        if (!userToRemoveOpt.isPresent()) {
            throw new RuntimeException("User not found: " + userEmail);
        }
        User userToRemove = userToRemoveOpt.get();
        
        boolean isCreator = groupChat.getCreatedBy().equals(requestingUserId);
        boolean isSelfRemoval = userToRemove.getId().equals(requestingUserId);
        
        if (!isCreator && !isSelfRemoval) {
            throw new SecurityException("Only group creator or the user themselves can remove participants");
        }
        
        // Cannot remove creator
        if (userToRemove.getId().equals(groupChat.getCreatedBy())) {
            throw new SecurityException("Cannot remove group creator");
        }
        
        // Remove participant
        groupChat.getParticipantIds().remove(userToRemove.getId());
        return groupChatRepository.save(groupChat);
    }

    // Get group chat by ID
    public Optional<GroupChat> getGroupChatById(String groupChatId) {
        return groupChatRepository.findById(groupChatId);
    }

    // Search group chats by name
    public List<GroupChat> searchGroupChatsByName(String name, String userId) {
        List<GroupChat> allMatches = groupChatRepository.findByNameContainingIgnoreCase(name);
        
        // Filter to only groups where user is a participant
        List<GroupChat> userGroups = new ArrayList<>();
        for (GroupChat group : allMatches) {
            if (group.getParticipantIds().contains(userId)) {
                userGroups.add(group);
            }
        }
        
        return userGroups;
    }
}
