import { Secret } from 'jsonwebtoken';

interface AuthConfig {
  jwt: {
    secret: Secret;
    expiresIn: string | number;
  };
  refreshToken: {
    expiresIn: string;
  };
  oauth: {
    google: {
      clientId: string | undefined;
      clientSecret: string | undefined;
      callbackURL: string;
    };
    linkedin: {
      clientId: string | undefined;
      clientSecret: string | undefined;
      callbackURL: string;
    };
  };
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const config: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET as Secret,
    expiresIn: '24h'
  },
  refreshToken: {
    expiresIn: '7d'
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`
    }
  }
};

export default config; 