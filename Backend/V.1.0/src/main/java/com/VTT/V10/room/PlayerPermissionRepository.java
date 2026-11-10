package com.VTT.V10.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlayerPermissionRepository extends JpaRepository<PlayerPermission, UUID> {

    @EntityGraph(attributePaths = {"member", "member.user"})
    Optional<PlayerPermission> findByMemberId(UUID memberId);

    @EntityGraph(attributePaths = {"member", "member.user"})
    List<PlayerPermission> findAllByMemberIdIn(Collection<UUID> memberIds);

    Optional<PlayerPermission> findByRoomIdAndMemberId(UUID roomId, UUID memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM PlayerPermission p WHERE p.room.id = :roomId")
    void deleteByRoomId(@Param("roomId") UUID roomId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM PlayerPermission p WHERE p.member.id = :memberId")
    void deleteByMemberId(@Param("memberId") UUID memberId);
}