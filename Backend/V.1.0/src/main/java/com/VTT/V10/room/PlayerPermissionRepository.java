package com.VTT.V10.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for PlayerPermission with batch loading capabilities.
 */
@Repository
public interface PlayerPermissionRepository extends JpaRepository<PlayerPermission, UUID> {

    @EntityGraph(attributePaths = {"member", "member.user"})
    Optional<PlayerPermission> findByMemberId(UUID memberId);

    @EntityGraph(attributePaths = {"member", "member.user"})
    List<PlayerPermission> findAllByMemberIdIn(Collection<UUID> memberIds);

    Optional<PlayerPermission> findByRoomIdAndMemberId(UUID roomId, UUID memberId);

    void deleteByRoomId(UUID roomId);

    void deleteByMemberId(UUID memberId);
}