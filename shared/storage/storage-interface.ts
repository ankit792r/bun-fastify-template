export interface BlobStorage {
  /**
   * Upload a file to storage
   * @param filePath - The path/key where the file should be stored, e.g. 'uploads/images/photo.jpg'
   * @param fileBuffer - The file content as a Buffer
   * @param contentType - MIME type of the file (e.g., 'image/jpeg', 'image/png')
   * @returns Promise resolving to the private internal URL of the uploaded file
   */
  upload(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param filePath - The path/key of the file to delete, e.g. 'uploads/images/photo.jpg'
   * @returns Promise that resolves when the file is deleted
   */
  delete(filePath: string): Promise<void>;

  /**
   * Replace an existing file in storage
   * This is equivalent to delete + upload, but may be optimized by the implementation
   * @param filePath - The path/key where the file should be stored, e.g. 'uploads/images/photo.jpg'
   * @param fileBuffer - The file content as a Buffer
   * @param contentType - MIME type of the file
   * @returns Promise resolving to the internal storage URL of the uploaded file
   */
  replace(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string>;

  /**
   * Download a file from storage as a readable stream
   * @param filePath - The path/key of the file to download, e.g. 'uploads/images/photo.jpg'
   * @returns Promise resolving to a readable stream of the file content
   */
  download(filePath: string): Promise<NodeJS.ReadableStream>;

  /**
   * Generate a presigned URL for downloading a file.
   * @param filePath - The path/key of the file to generate a URL for, e.g. 'uploads/images/photo.jpg'
   * @param expiresInSeconds - Number of seconds until the URL expires, defaults to implementation-specific value if not provided.
   * @returns Promise resolving to a presigned URL that allows temporary download access
   */
  generatePresignedUrlForDownload(
    filePath: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  /**
   * Get the storage URL for a given file path
   * @param filePath - The path/key of the file, e.g. 'uploads/images/photo.jpg'
   * @returns The full storage URL of the file e.g. https://storage.example.com/container/path/to/file.txt or file://path/to/diskRoot/container/path/to/file.txt
   */
  getStorageUrl(filePath: string): string;

  /**
   * Get the public URL for a given file path.
   * The file will only be accessible if the public endpoint is actually configured to serve files publically.
   * If the public url is not publically accessible and requires a token, use `generatePresignedUrlForDownload` instead.
   * @param filePath The path/key of the file, e.g. 'uploads/images/photo.jpg'
   * @returns The public URL of the file, e.g.
   *    - Azure: https://account.blob.core.windows.net/container/path/to/file.txt (without SAS token)
   *    - Disk: http://base/path/to/file.txt (without JWT token)
   *    - InMemory: http://base/path/to/file.txt (without JWT token)
   */
  getPublicUrl(filePath: string): string;
}
