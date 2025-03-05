import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export const getCachedData = unstable_cache(
  async (key: string) => {
    // Your data fetching logic here
    return null;
  },
  ['cache-key'],
  {
    revalidate: 3600,
    tags: ['cache-tag'],
  }
); 