import { NextRequest } from 'next/server';
import { OAuthCallbackResponse, OAuthProvider } from '@/types/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = await Promise.resolve(params);
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('No authorization code received')}`
      );
    }
    
    const response = await fetch(`${backendUrl}/api/auth/${provider}/callback?code=${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'manual'
    });

    // Handle redirect response from backend
    if (response.status === 302) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    // Try to parse the response as JSON regardless of status
    try {
      const data = await response.json();
      console.log('Backend response received:', { 
        hasToken: !!data.token, 
        hasUser: !!data.user,
        userId: data.user?.id 
      });

      const redirectUrl = new URL(`${frontendUrl}/dashboard`);
      redirectUrl.searchParams.set('token', data.token);
      redirectUrl.searchParams.set('user', JSON.stringify(data.user));

      return NextResponse.redirect(redirectUrl, {
        status: 302,
        headers: {
          'Location': redirectUrl.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (parseError) {
      // If we can't parse JSON, then it's a real error
      const errorText = await response.text();
      console.error('Backend OAuth callback failed:', errorText);
      return NextResponse.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`
      );
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    );
  }
} 