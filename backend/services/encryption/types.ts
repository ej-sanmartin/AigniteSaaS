export interface EncryptionKey {
  id: string;
  key: Buffer;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyId: string;
  salt: string;
}

export interface KeyRotationConfig {
  rotationInterval: number; // in milliseconds
  keyExpiration: number; // in milliseconds
  maxActiveKeys: number;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number; // in bytes
  ivLength: number; // in bytes
  authTagLength: number; // in bytes
  saltLength: number; // in bytes
  iterations: number;
} 