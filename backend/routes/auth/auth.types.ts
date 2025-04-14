import { Profile as OpenIDProfile } from 'passport-openidconnect';
import { User } from '../users/user.types';

export interface OAuthUser extends User {
  provider: string;
  providerId: string;
  isVerified: boolean;
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
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
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

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
} 