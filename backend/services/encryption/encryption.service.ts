import crypto from 'crypto';
import { keyManagementService } from './key_management.service';
import { EncryptionConfig, EncryptedData } from './types';
import { executeQuery } from '../../db/queryExecutor';

export class EncryptionService {
  private config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 12, // 96 bits
    authTagLength: 16, // 128 bits
    saltLength: 64, // 512 bits
    iterations: 100000
  };

  /**
   * Derives a key using PBKDF2
   */
  private async deriveKey(masterKey: Buffer, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        masterKey,
        salt,
        this.config.iterations,
        this.config.keyLength,
        'sha512',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Encrypts data using AES-256-GCM with PBKDF2 key derivation
   */
  async encrypt(data: string): Promise<EncryptedData> {
    const masterKey = await keyManagementService.getActiveKey();
    const salt = crypto.randomBytes(this.config.saltLength);
    const iv = crypto.randomBytes(this.config.ivLength);

    // Derive key using PBKDF2
    const derivedKey = await this.deriveKey(masterKey.key, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.config.algorithm,
      derivedKey,
      iv
    ) as crypto.CipherGCM;

    // Encrypt data
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
      encryptedData,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyId: masterKey.id,
      salt: salt.toString('hex')
    };
  }

  /**
   * Decrypts data using AES-256-GCM with PBKDF2 key derivation
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const masterKey = await keyManagementService.getActiveKey();
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    // Derive key using PBKDF2
    const derivedKey = await this.deriveKey(masterKey.key, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.config.algorithm,
      derivedKey,
      iv
    ) as crypto.DecipherGCM;

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decryptedData = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
  }

  /**
   * Re-encrypts data with a new key
   */
  async reencrypt(encryptedData: EncryptedData): Promise<EncryptedData> {
    const decryptedData = await this.decrypt(encryptedData);
    return this.encrypt(decryptedData);
  }

  /**
   * Verifies if data is encrypted with the current active key
   */
  async isCurrentKey(encryptedData: EncryptedData): Promise<boolean> {
    const currentKey = await keyManagementService.getActiveKey();
    return encryptedData.keyId === currentKey.id;
  }

  /**
   * Encrypts sensitive user data
   */
  async encryptUserData(userId: number, data: string): Promise<EncryptedData> {
    const encryptedData = await this.encrypt(data);
    
    // Store encrypted data in database
    const query = {
      text: `
        INSERT INTO encrypted_data (
          user_id,
          key_id,
          encrypted_data,
          iv,
          auth_tag
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      values: [
        userId,
        encryptedData.keyId,
        encryptedData.encryptedData,
        encryptedData.iv,
        encryptedData.authTag
      ]
    };

    await executeQuery(query);
    return encryptedData;
  }

  /**
   * Decrypts sensitive user data
   */
  async decryptUserData(userId: number, encryptedData: EncryptedData): Promise<string> {
    // Verify data belongs to user
    const query = {
      text: `
        SELECT id
        FROM encrypted_data
        WHERE user_id = $1
          AND key_id = $2
          AND encrypted_data = $3
          AND iv = $4
          AND auth_tag = $5
      `,
      values: [
        userId,
        encryptedData.keyId,
        encryptedData.encryptedData,
        encryptedData.iv,
        encryptedData.authTag
      ]
    };

    const result = await executeQuery<{ id: number }[]>(query);
    if (!result.length) {
      throw new Error('Encrypted data not found for user');
    }

    return this.decrypt(encryptedData);
  }
}

export const encryptionService = new EncryptionService(); 