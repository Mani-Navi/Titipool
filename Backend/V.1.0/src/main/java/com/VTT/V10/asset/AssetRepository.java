package com.VTT.V10.asset;

import com.VTT.V10.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Asset entities with eager user fetching to avoid N+1 queries.
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    @EntityGraph(attributePaths = {"user"})
    List<Asset> findAllByUserOrderByCreatedAtDesc(User user);

    @EntityGraph(attributePaths = {"user"})
    List<Asset> findAllByUserAndTypeOrderByCreatedAtDesc(User user, Asset.AssetType type);

    @EntityGraph(attributePaths = {"user"})
    List<Asset> findAllByUserAndCollectionName(User user, String collectionName);

    @EntityGraph(attributePaths = {"user"})
    List<Asset> findAllByUserAndFolderName(User user, String folderName);
}