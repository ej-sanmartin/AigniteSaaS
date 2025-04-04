import api from '@/utils/api';

export class TokenService {
  private static instance: TokenService;
  private refreshTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    // Start token refresh monitoring
    this.startTokenRefreshMonitoring();
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Remove all tokens
   */
  public removeTokens(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  /**
   * Start monitoring token refresh
   */
  private startTokenRefreshMonitoring(): void {
    // Refresh token 5 minutes before expiry (assuming 15-minute expiry)
    const refreshTime = 10 * 60 * 1000; // 10 minutes
    this.refreshTimeout = setTimeout(() => this.refreshToken(), refreshTime);
  }

  /**
   * Refresh token
   */
  private async refreshToken(): Promise<void> {
    try {
      await api.post('/auth/refresh');
      this.startTokenRefreshMonitoring();
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.removeTokens();
      // Redirect to login page
      window.location.href = '/login';
    }
  }
} 