import express from 'express';
import { User } from '../../routes/users/user.types';

declare global {
  declare namespace Express {
    interface Request {
      // Set by authentication middleware
      user?: User;
      
      // Set by role-based access control middleware
      roles?: string[];

      // Set by device tracking middleware
      device_info?: {
        ip: string;
        user_agent: string;
      };

      // Set by file upload middleware
      file?: Express.Multer.File;
    }
  }
}