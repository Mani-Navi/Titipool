package com.VTT.V10.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for FogRegion entities using indexed native JSONB lookups to avoid loading all regions into JVM memory.
 */
@Repository
public interface FogRegionRepository extends JpaRepository<FogRegion, UUID> {

    List<FogRegion> findBySceneId(UUID sceneId);

    void deleteBySceneId(UUID sceneId);

    @Query(
            value = "SELECT * FROM fog_regions WHERE scene_id = :sceneId AND (CAST(id AS TEXT) = :targetId OR points->>'id' = :targetId) LIMIT 1",
            nativeQuery = true
    )
    Optional<FogRegion> findBySceneIdAndTargetIdNative(
            @Param("sceneId") UUID sceneId,
            @Param("targetId") String targetId
    );

    @Modifying
    @Transactional
    @Query(
            value = "DELETE FROM fog_regions WHERE (CAST(id AS TEXT) = :targetId OR points->>'id' = :targetId) AND (:sceneId IS NULL OR scene_id = :sceneId)",
            nativeQuery = true
    )
    int deleteByTargetIdNative(
            @Param("sceneId") UUID sceneId,
            @Param("targetId") String targetId
    );
}