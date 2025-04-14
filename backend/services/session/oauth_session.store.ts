import session from 'express-session';
import { SessionService } from './session.service';
import { OAuthProvider } from './session.types';

// Extend SessionData to include our custom fields
interface CustomSessionData extends session.SessionData {
  provider?: OAuthProvider;
  state?: string;
  metadata?: Record<string, any>;
}

export class OAuthSessionStore extends session.Store {
  private sessionService: SessionService;

  constructor() {
    super();
    this.sessionService = new SessionService();
  }

  async get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): Promise<void> {
    try {
      // Only handle OAuth state sessions
      const oauthSession = await this.sessionService.getOAuthStateSessionBySessionId(sid);
      
      if (!oauthSession) {
        return callback(null, null);
      }

      const sessionData: CustomSessionData = {
        cookie: {
          originalMaxAge: oauthSession.expires_at.getTime() - oauthSession.created_at.getTime(),
          expires: oauthSession.expires_at,
          secure: true,
          httpOnly: true,
          path: '/',
        },
        provider: oauthSession.provider,
        state: oauthSession.state,
        metadata: oauthSession.metadata
      };

      callback(null, sessionData);
    } catch (error) {
      callback(error);
    }
  }

  async set(_sid: string, sessionData: session.SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      const customSession = sessionData as CustomSessionData;
      
      // Only create OAuth state sessions
      if (customSession.provider && customSession.state) {
        await this.sessionService.createOAuthStateSession({
          type: 'oauth_state',
          provider: customSession.provider as OAuthProvider,
          state: customSession.state,
          metadata: customSession.metadata || {}
        });
      }

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      const oauthSession = await this.sessionService.getOAuthStateSessionBySessionId(sid);
      if (oauthSession) {
        await this.sessionService.revokeOAuthStateSession(oauthSession.session_id);
      }
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(_sid: string, _session: session.SessionData, callback?: (err?: any) => void): Promise<void> {
    // OAuth state sessions are short-lived and don't need touch functionality
    callback?.();
  }
}