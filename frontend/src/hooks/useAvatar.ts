import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { bypassInterceptorsApi } from '@/utils/api';

const DEFAULT_REFRESH_INTERVAL = "900000";

interface AvatarResponse {
  avatarUrl: string;
}

/**
 * Custom fetcher for avatar that doesn't trigger auth redirects
 * 
 * This uses bypassInterceptorsApi to avoid triggering auth redirects on 401 errors.
 * 
 * We do this because avatar fetching is a non-critical UI element that
 * shouldn't redirect the user to login if it fails. This allows the UI
 * to gracefully degrade to a fallback avatar instead of disrupting the
 * user experience with a redirect.
 */
const avatarFetcher = async (url: string): Promise<string | null> => {
  try {
    const response = await bypassInterceptorsApi.get<AvatarResponse>(url);
    return response.data.avatarUrl;
  } catch (error) {
    console.warn('Avatar could not be loaded, using default avatar.');
    return null;
  }
};

export function useAvatar() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const { data: avatarUrl, error, isLoading } = useSWR(
    (isAuthenticated && !isAuthLoading) ? '/users/avatar' : null,
    avatarFetcher,
    {
      refreshInterval: parseInt(process.env.NEXT_PUBLIC_AVATAR_REFRESH_INTERVAL || DEFAULT_REFRESH_INTERVAL),
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
      // Don't retry on any errors.
      // TODO: Add a retry mechanism for most errors.
      shouldRetryOnError: () => false,
    }
  );

  return {
    avatarUrl,
    // Show loading while checking auth or loading the avatar.
    isLoading: isLoading || isAuthLoading || !isAuthenticated,
    isError: error
  };
} 