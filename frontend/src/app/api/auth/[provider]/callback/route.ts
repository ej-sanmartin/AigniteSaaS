import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Extract parameters from the URL
  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refreshToken');
  const user = searchParams.get('user');
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const error = searchParams.get('error');
  
  // Get base URL
  const baseUrl = url.origin;

  // Handle error case
  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error)}`);
  }

  // Validate required parameters
  if (!token || !refreshToken || !user) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Invalid authentication response')}`);
  }

  try {
    // Create a new response with the redirect
    const response = NextResponse.redirect(`${baseUrl}${returnTo}`);
    
    // Set cookies on the response object
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    response.cookies.set('user', user, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    // Return the response with cookies
    return response;
  } catch (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
  }
} 