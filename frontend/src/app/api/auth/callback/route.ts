import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  
  try {
    const token = url.searchParams.get('auth_token');
    const refreshToken = url.searchParams.get('refresh_token');
    const user = url.searchParams.get('user');
    const returnTo = url.searchParams.get('returnTo') || '/dashboard';

    if (!token || !refreshToken || !user) {
      throw new Error('Missing required parameters');
    }

    // Create response with redirect to dashboard
    const response = NextResponse.redirect(`${url.origin}${returnTo}`, {
      status: 302,
    });

    // Set auth_token cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    // Set refresh token cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Set user cookie
    response.cookies.set('user', user, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`,
      {
        status: 302,
      }
    );
  }
} 