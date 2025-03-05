import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AuthResponse, OAuthCallbackResponse, OAuthProvider } from '@/types/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: OAuthProvider } }
) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const provider = params.provider;

  if (!code) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`
    );
  }

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/auth/${provider}/callback?code=${code}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data: OAuthCallbackResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Authentication failed');
    }

    // Store the token in an HTTP-only cookie
    if (data.data?.token) {
      cookies().set('auth_token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // Set expiry based on your JWT expiry
        maxAge: 24 * 60 * 60, // 24 hours
      });
    }

    // Redirect to the dashboard or home page
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`
    );
  }
} 