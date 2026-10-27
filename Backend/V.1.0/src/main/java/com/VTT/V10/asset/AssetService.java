package com.VTT.V10.asset;

import com.VTT.V10.asset.dto.AssetResponse;
import com.VTT.V10.asset.dto.UpdateAssetRequest;
import com.VTT.V10.asset.storage.StorageService;
import com.VTT.V10.config.CacheConfig;
import com.VTT.V10.user.User;
import com.VTT.V10.user.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing user assets, validation, in-memory media compression, and delegated storage operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final EntityManager entityManager;
    private final CacheManager cacheManager;

    private static final long MAX_MAP_SIZE = 15 * 1024 * 1024;    // 15 MB
    private static final long MAX_TOKEN_SIZE = 3 * 1024 * 1024;   // 3 MB
    private static final long MAX_PROP_SIZE = 4 * 1024 * 1024;    // 4 MB
    private static final long DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "audio/mpeg", "audio/ogg", "audio/wav"
    );

    @Transactional
    public AssetResponse uploadAsset(
            MultipartFile file,
            String name,
            String type,
            Integer dpi,
            Integer columns,
            Integer rows,
            Float rotation,
            Boolean isVisible,
            Boolean isLocked,
            String defaultText,
            String textColor,
            Integer fontSize,
            String fontFamily,
            String userEmail
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "فایل ارسالی خالی است");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "فرمت فایل مجاز نیست");
        }

        byte[] fileBytes = file.getBytes();
        validateFileMagicBytes(fileBytes);

        Asset.AssetType assetType = parseAssetType(type);
        validateFileSize(fileBytes.length, assetType);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        String extension = getSafeExtension(file.getOriginalFilename());
        String uniqueFileName = UUID.randomUUID() + extension;

        Integer width = null;
        Integer height = null;

        // پردازش و بهینه‌سازی تصویر در حافظه پیش از ارسال به StorageService (سازگار با دیسک محلی و S3/MinIO)
        if (contentType.startsWith("image/") && !contentType.contains("gif")) {
            try {
                BufferedImage bimg = ImageIO.read(new ByteArrayInputStream(fileBytes));
                if (bimg != null) {
                    width = bimg.getWidth();
                    height = bimg.getHeight();

                    int maxDim = (assetType == Asset.AssetType.MAP) ? 3840 : 1024;
                    double quality = (assetType == Asset.AssetType.MAP) ? 0.85 : 0.90;

                    if (width > maxDim || height > maxDim) {
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        String formatName = extension.replace(".", "");
                        if ("jpg".equalsIgnoreCase(formatName)) {
                            formatName = "jpeg";
                        }

                        Thumbnails.of(bimg)
                                .size(maxDim, maxDim)
                                .outputFormat(formatName)
                                .outputQuality(quality)
                                .toOutputStream(out);

                        byte[] compressedBytes = out.toByteArray();
                        if (compressedBytes.length > 0 && compressedBytes.length < fileBytes.length) {
                            fileBytes = compressedBytes;
                            BufferedImage resizedImg = ImageIO.read(new ByteArrayInputStream(fileBytes));
                            if (resizedImg != null) {
                                width = resizedImg.getWidth();
                                height = resizedImg.getHeight();
                            }
                        }
                    }
                }
            } catch (Throwable t) {
                log.warn("In-memory image optimization skipped for {}: {}", uniqueFileName, t.getMessage());
            }
        }

        long finalFileSize = fileBytes.length;
        String publicFileUrl;
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            publicFileUrl = storageService.store(uniqueFileName, inputStream, finalFileSize, contentType);
        }

        String safeDisplayName = (name != null && !name.isBlank())
                ? name.replaceAll("[^a-zA-Z0-9_\\-\\s\u0600-\u06FF]", "")
                : "asset_" + System.currentTimeMillis();

        Asset asset = Asset.builder()
                .name(safeDisplayName)
                .type(assetType)
                .fileUrl(publicFileUrl)
                .fileSize(finalFileSize)
                .mimeType(contentType)
                .width(width)
                .height(height)
                .dpi(dpi != null ? dpi : 150)
                .gridColumns(columns != null ? columns : 1)
                .gridRows(rows != null ? rows : 1)
                .rotation(rotation != null ? rotation : 0f)
                .isVisible(isVisible != null ? isVisible : true)
                .isLocked(isLocked != null ? isLocked : false)
                .defaultText(defaultText)
                .textColor(textColor)
                .fontSize(fontSize)
                .fontFamily(fontFamily)
                .user(user)
                .build();

        assetRepository.save(asset);
        return mapToResponse(asset);
    }

    private void validateFileMagicBytes(byte[] header) {
        if (header == null || header.length < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "محتوای فایل ارسالی مخدوش است");
        }

        boolean isJpg = (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF);
        boolean isPng = (header[0] == (byte) 0x89 && header[1] == (byte) 0x50 && header[2] == (byte) 0x4E && header[3] == (byte) 0x47);
        boolean isGif = (header[0] == 'G' && header[1] == 'I' && header[2] == 'F');
        boolean isWebp = (header.length >= 8 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F');
        boolean isAudio = (header[0] == (byte) 0xFF && (header[1] & (byte) 0xE0) == (byte) 0xE0)
                || (header[0] == 'O' && header[1] == 'g' && header[2] == 'g' && header[3] == 'S')
                || (header.length >= 8 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F');

        if (!isJpg && !isPng && !isGif && !isWebp && !isAudio) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "بایت‌های باینری فایل با پسوند آن همخوانی ندارد");
        }
    }

    private String getSafeExtension(String originalFilename) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            if (List.of(".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp3", ".ogg", ".wav").contains(ext)) {
                return ext;
            }
        }
        return ".bin";
    }

    @Transactional
    public AssetResponse createAssetFromUrl(
            String url,
            String name,
            String type,
            Integer dpi,
            Integer columns,
            Integer rows,
            String userEmail
    ) {
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "آدرس لینک نمی‌تواند خالی باشد");
        }

        String cleanUrl = url.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "فرمت پروتکل لینک باید http یا https باشد");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        Asset.AssetType assetType = parseAssetType(type);
        String finalName = (name != null && !name.isBlank()) ? name : "منبع لینک‌شده";

        Asset asset = Asset.builder()
                .name(finalName)
                .type(assetType)
                .fileUrl(cleanUrl)
                .dpi(dpi != null ? dpi : 150)
                .gridColumns(columns != null ? columns : 1)
                .gridRows(rows != null ? rows : 1)
                .isVisible(true)
                .isLocked(false)
                .user(user)
                .build();

        assetRepository.save(asset);
        return mapToResponse(asset);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getUserAssets(String userEmail, String type) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        List<Asset> assets;
        if (type != null && !type.isBlank()) {
            try {
                Asset.AssetType assetType = Asset.AssetType.valueOf(type.trim().toUpperCase());
                assets = assetRepository.findAllByUserAndTypeOrderByCreatedAtDesc(user, assetType);
            } catch (IllegalArgumentException e) {
                assets = assetRepository.findAllByUserOrderByCreatedAtDesc(user);
            }
        } else {
            assets = assetRepository.findAllByUserOrderByCreatedAtDesc(user);
        }

        return assets.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public AssetResponse updateAsset(UUID assetId, UpdateAssetRequest updateData, String userEmail) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "است مورد نظر یافت نشد"));

        if (!asset.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی غیرمجاز");
        }

        if (updateData != null) {
            if (updateData.getName() != null) asset.setName(updateData.getName());
            if (updateData.getDpi() != null) asset.setDpi(updateData.getDpi());
            if (updateData.getGridColumns() != null) asset.setGridColumns(updateData.getGridColumns());
            if (updateData.getGridRows() != null) asset.setGridRows(updateData.getGridRows());
            if (updateData.getRotation() != null) asset.setRotation(updateData.getRotation());
            if (updateData.getIsVisible() != null) asset.setIsVisible(updateData.getIsVisible());
            if (updateData.getIsLocked() != null) asset.setIsLocked(updateData.getIsLocked());
            if (updateData.getFolderName() != null) asset.setFolderName(updateData.getFolderName());
            if (updateData.getCollectionName() != null) asset.setCollectionName(updateData.getCollectionName());
            if (updateData.getCollectionColor() != null) asset.setCollectionColor(updateData.getCollectionColor());
            if (updateData.getDefaultText() != null) asset.setDefaultText(updateData.getDefaultText());
            if (updateData.getTextColor() != null) asset.setTextColor(updateData.getTextColor());
            if (updateData.getFontSize() != null) asset.setFontSize(updateData.getFontSize());
            if (updateData.getFontFamily() != null) asset.setFontFamily(updateData.getFontFamily());
        }

        assetRepository.save(asset);
        return mapToResponse(asset);
    }

    @Transactional
    public void deleteAsset(UUID assetId, String userEmail) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "است مورد نظر یافت نشد"));

        if (!asset.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی غیرمجاز");
        }

        entityManager.createNativeQuery("UPDATE tokens SET asset_id = NULL WHERE asset_id = :assetId")
                .setParameter("assetId", assetId)
                .executeUpdate();

        entityManager.createNativeQuery("UPDATE scenes SET asset_id = NULL WHERE asset_id = :assetId")
                .setParameter("assetId", assetId)
                .executeUpdate();

        if (cacheManager != null) {
            Cache scenesCache = cacheManager.getCache(CacheConfig.CACHE_SCENES);
            if (scenesCache != null) {
                scenesCache.clear();
            }
        }

        storageService.delete(asset.getFileUrl());
        assetRepository.delete(asset);
    }

    private void validateFileSize(long size, Asset.AssetType type) {
        long allowedSize = switch (type) {
            case MAP -> MAX_MAP_SIZE;
            case TOKEN -> MAX_TOKEN_SIZE;
            case PROP -> MAX_PROP_SIZE;
            default -> DEFAULT_MAX_SIZE;
        };

        if (size > allowedSize) {
            String limitLabel = (allowedSize / (1024 * 1024)) + " مگابایت";
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "حجم فایل برای این نوع بیشتر از حد مجاز است (حداکثر " + limitLabel + ")");
        }
    }

    private Asset.AssetType parseAssetType(String type) {
        if (type != null && !type.isBlank()) {
            try {
                return Asset.AssetType.valueOf(type.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return Asset.AssetType.TOKEN;
    }

    public AssetResponse mapToResponse(Asset asset) {
        return AssetResponse.builder()
                .id(asset.getId())
                .name(asset.getName())
                .type(asset.getType().name())
                .fileUrl(asset.getFileUrl())
                .fileSize(asset.getFileSize())
                .mimeType(asset.getMimeType())
                .width(asset.getWidth())
                .height(asset.getHeight())
                .dpi(asset.getDpi())
                .gridColumns(asset.getGridColumns())
                .gridRows(asset.getGridRows())
                .rotation(asset.getRotation())
                .isVisible(asset.getIsVisible())
                .isLocked(asset.getIsLocked())
                .folderName(asset.getFolderName())
                .collectionName(asset.getCollectionName())
                .collectionColor(asset.getCollectionColor())
                .defaultText(asset.getDefaultText())
                .textColor(asset.getTextColor())
                .fontSize(asset.getFontSize())
                .fontFamily(asset.getFontFamily())
                .ownerUsername(asset.getUser() != null ? asset.getUser().getUsername() : null)
                .createdAt(asset.getCreatedAt())
                .build();
    }
}