package com.VTT.V10.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * High-performance repository for Token entities utilizing eager EntityGraphs
 * to eliminate N+1 queries during real-time movement and scene state loading.
 */
@Repository
public interface TokenRepository extends JpaRepository<Token, UUID> {

    @EntityGraph(attributePaths = {"asset"})
    List<Token> findBySceneId(UUID sceneId);

    @EntityGraph(attributePaths = {"scene", "scene.room", "scene.room.owner"})
    Optional<Token> findWithSceneAndRoomById(UUID id);

    boolean existsBySceneIdAndControlledBy(UUID sceneId, String controlledBy);

    void deleteBySceneId(UUID sceneId);
}