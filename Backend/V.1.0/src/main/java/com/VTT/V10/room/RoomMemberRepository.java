package com.VTT.V10.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for RoomMember entity with eager join fetch graphs to eliminate N+1 queries.
 */
@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    @EntityGraph(attributePaths = {"user", "room", "room.owner"})
    Optional<RoomMember> findByRoomIdAndUserEmail(UUID roomId, String email);

    @EntityGraph(attributePaths = {"user", "room", "room.owner"})
    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    @EntityGraph(attributePaths = {"room", "room.owner", "user"})
    List<RoomMember> findAllByUserId(UUID userId);

    @EntityGraph(attributePaths = {"user", "room"})
    List<RoomMember> findAllByRoomId(UUID roomId);

    @Query("SELECT rm.room.id, COUNT(rm.id) FROM RoomMember rm WHERE rm.room.id IN :roomIds GROUP BY rm.room.id")
    List<Object[]> countMembersByRoomIds(@Param("roomIds") List<UUID> roomIds);

    int countByRoomId(UUID roomId);

    long countByUserId(UUID userId);

    void deleteByRoomId(UUID roomId);

    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);
}