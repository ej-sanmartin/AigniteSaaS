import { NextRequest } from 'next/server';
import { OAuthCallbackResponse, OAuthProvider } from '@/types/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = await Promise.resolve(params);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('No authorization code received')}`
    );
  }

  try {
    // Exchange code for tokens with backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/${provider}/callback?code=${code}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      throw new Error(errorData.message || 'Failed to authenticate with provider');
    }

    const data = await backendResponse.json();

    if (!data.token || !data.refreshToken || !data.user) {
      throw new Error('Invalid response from authentication server');
    }

    // Create response with redirect to dashboard
    const response = NextResponse.redirect(
      `${process.env.FRONTEND_URL}/dashboard`
    );

    // Set HTTP-only cookies for tokens
    response.cookies.set('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    response.cookies.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Set user data in a non-HTTOnly cookie for client-side access
    response.cookies.set('user', JSON.stringify(data.user), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    );
  }
} 