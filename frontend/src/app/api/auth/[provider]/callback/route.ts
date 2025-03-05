import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const provider = params.provider;

  if (!code) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`);
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    // Store the token in cookies or local storage
    const token = data.token;
    
    // Redirect to the dashboard or home page
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`
    );
  }
} 