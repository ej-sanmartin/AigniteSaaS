export interface StorageProvider {
  /**
   * Uploads a buffer to storage and returns the key
   * @param buffer - The file buffer to upload
   * @param key - The storage key/path
   * @returns Promise<string> - The storage key
   */
  upload(buffer: Buffer, key: string): Promise<string>;

  /**
   * Gets a signed URL for accessing a stored file
   * @param key - The storage key/path
   * @param expiresIn - Time in seconds until URL expires (default: 900)
   * @returns Promise<string> - The signed URL
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
} 