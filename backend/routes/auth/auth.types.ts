import { Request } from 'express';
import { Profile as OpenIDProfile } from 'passport-openidconnect';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface OAuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  provider: 'google' | 'linkedin' | 'github';
  providerId: string;
  createdAt: Date;
  password?: string;
}

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export interface OAuthProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  emails?: { value: string }[];
}

export interface LinkedInProfile extends OpenIDProfile {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
  _json: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _raw?: string;
  provider: string;
  id: string;
  emails: { value: string }[];
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  photos: { value: string }[];
}

export interface GitHubProfile {
  id: string;
  displayName: string;
  emails: { value: string }[];
  _json: {
    firstName: string;
    lastName: string;
    email: string;
  };
  name: {
    givenName: string;
    familyName: string;
  };
  photos: { value: string }[];
  provider: string;
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
} 