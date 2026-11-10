package com.VTT.V10.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TokenRepository extends JpaRepository<Token, UUID> {

    @EntityGraph(attributePaths = {"asset"})
    List<Token> findBySceneId(UUID sceneId);

    @EntityGraph(attributePaths = {"scene", "scene.room", "scene.room.owner"})
    Optional<Token> findWithSceneAndRoomById(UUID id);

    boolean existsBySceneIdAndControlledBy(UUID sceneId, String controlledBy);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM Token t WHERE t.scene.id = :sceneId")
    void deleteBySceneId(@Param("sceneId") UUID sceneId);
}