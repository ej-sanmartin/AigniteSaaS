import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Paths that should not be accessible when authenticated
const authPaths = [
  '/login',
  '/signup',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes to prevent cookie issues
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||  // Skip any path with a file extension (.json, .png, etc)
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('auth_token');
  const refreshToken = request.cookies.get('refresh_token');
  const userCookie = request.cookies.get('user');
  
  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the path is an auth path (login/signup)
  const isAuthPath = authPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check for tokens in cookies or URL parameters
  const hasToken = authToken || request.nextUrl.searchParams.has('auth_token');
  const hasRefreshToken = refreshToken || request.nextUrl.searchParams.has('refresh_token');

  // If the path is protected and there's no token, redirect to login
  if (isProtectedPath && !hasToken && !hasRefreshToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and tries to access auth paths, redirect to dashboard
  if (isAuthPath && (hasToken || hasRefreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure matcher to capture all routes except API and static files
export const config = {
  matcher: [
    /*
     * Match all paths except
     * - API routes (/api/*)
     * - Static files (/_next/*)
     * - Media files (anything with a file extension)
     * - Root level routes with a file extension (e.g., /manifest.json)
     */
    '/((?!_next/|api/).*)',
  ],
}; 