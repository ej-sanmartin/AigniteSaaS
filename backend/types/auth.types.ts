export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

// OAuth specific types
export interface OAuthProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  emails?: { value: string }[];
}

export interface OAuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  provider: 'google' | 'linkedin';
  providerId: string;
  createdAt: Date;
}
