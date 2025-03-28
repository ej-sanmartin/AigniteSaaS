import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token');

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/refresh-token`, {
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

    // Create new response with updated cookies and include user data
    const resp = NextResponse.json({ 
      message: 'Token refreshed',
      user: data.user // Include user data in response
    });

    // Set the new access token
    resp.cookies.set('auth_token', data.token, {
      httpOnly: false, // Not httpOnly so JavaScript can read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set the new refresh token if provided
    if (data.refreshToken) {
      resp.cookies.set('refresh_token', data.refreshToken, {
        httpOnly: true, // Keep refresh token httpOnly for security
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    // Add the user cookie if present in response
    if (data.user) {
      const userData = typeof data.user === 'string' 
        ? data.user 
        : JSON.stringify(data.user);
        
      resp.cookies.set('user', userData, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      });
    }

    return resp;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 401 }
    );
  }
} 