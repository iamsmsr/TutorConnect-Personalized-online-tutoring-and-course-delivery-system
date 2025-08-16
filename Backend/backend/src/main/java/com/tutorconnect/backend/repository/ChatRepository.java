package com.tutorconnect.backend.repository;

import com.tutorconnect.backend.model.Chat;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface ChatRepository extends MongoRepository<Chat, String> {
    // Find chats where userIds array contains the specified userId (as string)
    List<Chat> findByUserIdsContaining(String userId);
    
    // Alternative query method for ObjectId if needed
    List<Chat> findByUserIdsContaining(ObjectId userId);
    
    // Custom query to find chat between two specific users
    @Query("{ 'userIds': { $all: [?0, ?1] } }")
    List<Chat> findChatBetweenUsers(String userId1, String userId2);
}
