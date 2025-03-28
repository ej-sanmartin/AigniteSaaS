import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('auth_token');
    const refreshToken = url.searchParams.get('refresh_token');
    const user = url.searchParams.get('user');
    const returnTo = url.searchParams.get('returnTo') || '/dashboard';

    console.log('Auth callback received:', {
      token: token ? 'present' : 'missing',
      token_length: token?.length,
      refreshToken: refreshToken ? 'present' : 'missing',
      refreshToken_length: refreshToken?.length,
      user: user ? 'present' : 'missing',
      user_length: user?.length,
      returnTo
    });

    if (!token || !refreshToken || !user) {
      throw new Error('Missing required parameters');
    }

    // Create response with redirect to dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}${returnTo}`;
    console.log('Redirecting to:', redirectUrl);

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
        console.error('Failed to parse user data:', error);
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
    console.error('Auth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`,
      {
        status: 302,
      }
    );
  }
} 