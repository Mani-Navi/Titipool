package com.VTT.V10.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * High-performance repository for Room entity operations.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    @EntityGraph(attributePaths = {"owner", "template"})
    Optional<Room> findByCode(String code);

    @EntityGraph(attributePaths = {"owner"})
    @Query("SELECT r FROM Room r WHERE r.isActive = true")
    List<Room> findAllActiveRoomsWithOwner();

    List<Room> findAllByIsActiveTrue();

    boolean existsByOwnerIdAndNameIgnoreCase(UUID ownerId, String name);

    @Modifying
    @Query("UPDATE Room r SET r.isActive = false WHERE r.expiresAt < :now AND r.isActive = true")
    int deactivateExpiredRooms(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Room r SET r.lastActive = :now, r.gmLastSeenAt = :now WHERE r.id = :roomId")
    int touchRoomActivity(@Param("roomId") UUID roomId, @Param("now") LocalDateTime now);
}