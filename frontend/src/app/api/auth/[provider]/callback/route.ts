import { NextRequest } from 'next/server';
import { OAuthCallbackResponse, OAuthProvider } from '@/types/auth';
import { NextResponse } from 'next/server';

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
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('No authorization code received')}`
    );
  }

  try {
    // Exchange code for tokens with backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/auth/${provider}/callback?code=${code}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      throw new Error(errorData.message || 'Failed to authenticate with provider');
    }

    const data = await backendResponse.json();
    console.log('Received OAuth data:', { 
      hasToken: !!data.token, 
      hasRefreshToken: !!data.refreshToken,
      hasUser: !!data.user 
    });

    if (!data.token || !data.refreshToken || !data.user) {
      throw new Error('Invalid response from authentication server');
    }

    // Set tokens and user data in localStorage through a script
    const script = `
      <script>
        window.localStorage.setItem('token', '${data.token}');
        window.localStorage.setItem('refreshToken', '${data.refreshToken}');
        window.localStorage.setItem('user', '${JSON.stringify(data.user)}');
        window.location.href = '/dashboard';
      </script>
    `;

    return new Response(script, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    );
  }
} 