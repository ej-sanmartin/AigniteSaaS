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
  const authToken = request.cookies.get('auth_token');
  const refreshToken = request.cookies.get('refresh_token');

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the path is an auth path (login/signup)
  const isAuthPath = authPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check for tokens in cookies or URL parameters
  const hasToken = authToken || request.nextUrl.searchParams.has('token');
  const hasRefreshToken = refreshToken || request.nextUrl.searchParams.has('refreshToken');

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

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!^api/|_next/static|_next/image|favicon.ico|icons).*)',
  ],
}; 