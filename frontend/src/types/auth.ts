export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  subscription?: {
    status: 'active' | 'inactive' | 'canceled';
    plan: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
} 