import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token');

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cookie': `refresh_token=${refreshToken.value}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // Create new response with updated cookies
    const resp = NextResponse.json({ message: 'Token refreshed' });

    // Set the new access token
    resp.cookies.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set the new refresh token if provided
    if (data.refreshToken) {
      resp.cookies.set('refresh_token', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return resp;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 401 }
    );
  }
} 