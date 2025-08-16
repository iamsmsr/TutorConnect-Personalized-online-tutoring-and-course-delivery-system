package com.tutorconnect.backend.repository;

import com.tutorconnect.backend.model.GroupChat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupChatRepository extends MongoRepository<GroupChat, String> {
    
    // Find all group chats where the user is a participant
    @Query("{ 'participantIds': ?0 }")
    List<GroupChat> findByParticipantIdsContaining(String userId);
    
    // Find group chats created by a specific user
    List<GroupChat> findByCreatedBy(String userId);
    
    // Find group chats by name (for search functionality)
    @Query("{ 'name': { $regex: ?0, $options: 'i' } }")
    List<GroupChat> findByNameContainingIgnoreCase(String name);
}
