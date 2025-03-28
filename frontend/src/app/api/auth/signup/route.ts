import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${process.env.BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    // Create response with user data
    const resp = NextResponse.json({ user: data.user });

    // Set the access token
    resp.cookies.set('auth_token', data.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
      // Don't set domain - let browser determine it automatically
    });

    // Set the refresh token
    if (data.refreshToken) {
      resp.cookies.set('refresh_token', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        // Don't set domain - let browser determine it automatically
      });
    }

    // Add the user cookie - make sure we have valid JSON
    const userData = typeof data.user === 'string' 
      ? data.user 
      : JSON.stringify(data.user);
      
    resp.cookies.set('user', userData, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
      // Don't set domain - let browser determine it automatically
    });

    return resp;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 400 }
    );
  }
} 