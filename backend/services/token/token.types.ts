export interface TokenPayload {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  sessionId?: string;
}