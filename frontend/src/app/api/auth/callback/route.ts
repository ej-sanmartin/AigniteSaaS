import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('auth_token');
    const refreshToken = url.searchParams.get('refresh_token');
    const user = url.searchParams.get('user');
    const returnTo = url.searchParams.get('returnTo') || '/dashboard';

    if (!token || !refreshToken || !user) {
      throw new Error('Missing required parameters');
    }

    // Create response with redirect to dashboard
    const redirectUrl = `${process.env.FRONTEND_URL}${returnTo}`;

    const response = NextResponse.redirect(redirectUrl, {
      status: 302, // Use 302 for temporary redirect
    });

    // Set auth_token cookie that can be read by JavaScript
    // This is needed for the Authorization header
    response.cookies.set('auth_token', token, {
      httpOnly: false, // Not httpOnly so JavaScript can read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // Don't set domain - let browser determine it automatically
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true, // Keep refresh token httpOnly for security
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      // Don't set domain - let browser determine it automatically
    });

    // Make sure user data is properly JSON stringified
    let userData = user;
    try {
      // If it's already a JSON string, parse it to make sure it's valid
      JSON.parse(user);
    } catch (e) {
      // If it's not a valid JSON string, assume it needs to be decoded first
      try {
        userData = decodeURIComponent(user);
        // Test if it's valid JSON after decoding
        JSON.parse(userData);
      } catch (error) {
        userData = user; // Fallback to original
      }
    }

    // Set the user cookie
    response.cookies.set('user', userData, {
      httpOnly: false, // Not httpOnly so we can read user info in frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // Don't set domain - let browser determine it automatically
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`,
      {
        status: 302,
      }
    );
  }
} 