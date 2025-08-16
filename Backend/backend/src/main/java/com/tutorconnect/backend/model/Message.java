package com.tutorconnect.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "message")
public class Message {
    @Id
    private String id;
    private String chatId;
    private String groupChatId; // For group messages
    private String senderId;
    private String recipientId;
    private String content;
    private Date timestamp = new Date();
    private String status; // delivered/read
    private String messageType = "INDIVIDUAL"; // INDIVIDUAL or GROUP

    // Constructors
    public Message() {}
    
    public Message(String chatId, String senderId, String recipientId, String content) {
        this.chatId = chatId;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.timestamp = new Date();
        this.status = "delivered";
        this.messageType = "INDIVIDUAL";
    }
    
    // Constructor for group messages
    public static Message createGroupMessage(String groupChatId, String senderId, String content) {
        Message message = new Message();
        message.groupChatId = groupChatId;
        message.senderId = senderId;
        message.content = content;
        message.timestamp = new Date();
        message.status = "delivered";
        message.messageType = "GROUP";
        return message;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = chatId;
    }

    public String getGroupChatId() {
        return groupChatId;
    }

    public void setGroupChatId(String groupChatId) {
        this.groupChatId = groupChatId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }
}
