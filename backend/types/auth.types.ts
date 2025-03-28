export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

// OAuth specific types
export interface OAuthProfile {
  id: string;
  displayName: string;
  emails?: { value: string }[];
  _json: {
    given_name?: string;
    family_name?: string;
  };
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
