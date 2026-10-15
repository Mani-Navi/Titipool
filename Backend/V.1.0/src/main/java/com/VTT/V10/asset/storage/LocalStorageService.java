package com.VTT.V10.asset.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * High-performance local disk storage implementation featuring strict directory-traversal protection.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final String UPLOAD_DIR = "uploads";
    private final Path rootPath;

    public LocalStorageService() {
        this.rootPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
        try {
            if (!Files.exists(this.rootPath)) {
                Files.createDirectories(this.rootPath);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialize upload directory", e);
        }
    }

    @Override
    public String store(String filename, InputStream data, long size, String contentType) {
        Path targetLocation = this.rootPath.resolve(filename).normalize();
        if (!targetLocation.startsWith(this.rootPath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "مسیر ذخیره‌سازی فایل نامعتبر است");
        }

        try {
            Files.copy(data, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + filename;
        } catch (IOException e) {
            log.error("Failed to store file {}: {}", filename, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "خطا در نوشتن فایل روی دیسک سرور");
        }
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith("/uploads/")) {
            return;
        }

        String subPath = fileUrl.substring("/uploads/".length());
        Path targetPath = this.rootPath.resolve(subPath).normalize();

        if (targetPath.startsWith(this.rootPath)) {
            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException e) {
                log.warn("Failed to delete physical file {}: {}", fileUrl, e.getMessage());
            }
        }
    }
}