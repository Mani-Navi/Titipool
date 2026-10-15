package com.VTT.V10.asset.storage;

import java.io.InputStream;

/**
 * Abstraction layer for file storage operations, enabling seamless swap between local disk, S3, and MinIO backends.
 */
public interface StorageService {

    /**
     * Stores a file stream safely and returns the public accessibility URL or path.
     *
     * @param filename    sanitized unique filename
     * @param data        input stream of file bytes
     * @param size        expected byte count
     * @param contentType MIME type of content
     * @return public accessible URI
     */
    String store(String filename, InputStream data, long size, String contentType);

    /**
     * Deletes a physical file identified by its public URL.
     *
     * @param fileUrl public URL or file path
     */
    void delete(String fileUrl);
}