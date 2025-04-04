import { Request } from 'express';
import { Profile as OpenIDProfile } from 'passport-openidconnect';
import { Profile } from 'passport-google-oauth20';
import { BaseUser } from '../../types/express';

// Use a different name to avoid conflict with Express.Request
export interface AuthenticatedRequestType {
  user?: TokenPayload;
}

export interface User extends BaseUser {
  provider?: string;
  providerId?: string;
}

export interface OAuthUser extends User {
  provider: string;
  providerId: string;
  isVerified: boolean;
}

export interface TokenPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface LinkedInUserInfo {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
  name?: string;
  email_verified?: boolean;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUserInfo {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{
    value: string;
    type?: string;
  }>;
  photos?: Array<{
    value: string;
  }>;
  provider: string;
} 