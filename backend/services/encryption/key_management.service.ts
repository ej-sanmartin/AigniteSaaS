import crypto from 'crypto';
import { executeQuery } from '../../db/queryExecutor';
import { EncryptionKey, KeyRotationConfig } from './types';

export class KeyManagementService {
  private config: KeyRotationConfig = {
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
    keyExpiration: 90 * 24 * 60 * 60 * 1000, // 90 days
    maxActiveKeys: 3
  };

  /**
   * Generates a new encryption key
   */
  private generateKey(): Buffer {
    return crypto.randomBytes(32); // 256 bits
  }

  /**
   * Creates a new encryption key in the database
   */
  async createKey(): Promise<EncryptionKey> {
    const key = this.generateKey();
    const id = crypto.randomBytes(16).toString('hex');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.config.keyExpiration);

    const query = {
      text: `
        INSERT INTO encryption_keys (id, key, created_at, expires_at, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, created_at, expires_at, is_active
      `,
      values: [id, key, createdAt, expiresAt]
    };

    const result = await executeQuery<EncryptionKey[]>(query);
    return {
      ...result[0],
      key
    };
  }

  /**
   * Gets the current active encryption key
   */
  async getActiveKey(): Promise<EncryptionKey> {
    const query = {
      text: `
        SELECT id, key, created_at, expires_at, is_active
        FROM encryption_keys
        WHERE is_active = true
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `
    };

    const result = await executeQuery<EncryptionKey[]>(query);
    
    if (!result.length) {
      return this.createKey();
    }

    return result[0];
  }

  /**
   * Rotates encryption keys
   */
  async rotateKeys(): Promise<void> {
    // Deactivate expired keys
    const deactivateQuery = {
      text: `
        UPDATE encryption_keys
        SET is_active = false
        WHERE expires_at <= NOW()
      `
    };
    await executeQuery(deactivateQuery);

    // Check if we need to create a new key
    const activeKeysQuery = {
      text: `
        SELECT COUNT(*) as count
        FROM encryption_keys
        WHERE is_active = true
      `
    };
    const activeKeys = await executeQuery<{count: number}[]>(activeKeysQuery);

    if (activeKeys[0].count < this.config.maxActiveKeys) {
      await this.createKey();
    }
  }

  /**
   * Revokes a specific key
   */
  async revokeKey(keyId: string): Promise<void> {
    const query = {
      text: `
        UPDATE encryption_keys
        SET is_active = false
        WHERE id = $1
      `,
      values: [keyId]
    };
    await executeQuery(query);
  }

  /**
   * Revokes all keys for a user
   */
  async revokeAllUserKeys(userId: number): Promise<void> {
    const query = {
      text: `
        UPDATE encryption_keys
        SET is_active = false
        WHERE user_id = $1
      `,
      values: [userId]
    };
    await executeQuery(query);
  }
}

export const keyManagementService = new KeyManagementService(); 