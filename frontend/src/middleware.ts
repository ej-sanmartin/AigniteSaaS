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

// Paths that should be skipped by middleware
const skipPaths = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/styles',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (skipPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session_id');
  
  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the path is an auth path (login/signup)
  const isAuthPath = authPaths.some(path => 
    pathname.startsWith(path)
  );

  // If the path is protected and there's no session, redirect to login
  if (isProtectedPath && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(url);
  }

  // If the path is an auth path and there is a session, redirect to dashboard
  if (isAuthPath && session) {
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