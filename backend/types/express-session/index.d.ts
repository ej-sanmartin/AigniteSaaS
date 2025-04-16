import expressSession from "express-session";

declare global {
  declare namespace Session {
    interface SessionData {
      // Set by authentication middleware
      user_id?: number;
      
      // Set by session type middleware
      type?: string;
      
      // Set by device tracking middleware
      device_info?: {
        ip: string;
        user_agent: string;
      };
      
      // Generic metadata storage
      metadata?: Record<string, any>;
    }

    interface Session {
      state?: string;
    }
  }
}