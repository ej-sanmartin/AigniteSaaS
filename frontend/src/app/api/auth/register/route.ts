import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/dashboard';

    // Forward request to backend with data in body
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/register?returnTo=${encodeURIComponent(returnTo)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: 'include',
      }
    );

    // Get response data
    const data = await response.json();

    // Forward all cookies from backend to frontend
    const cookies = response.headers.getSetCookie();
    const responseHeaders = new Headers();
    cookies.forEach(cookie => {
      responseHeaders.append('Set-Cookie', cookie);
    });

    // Handle error responses
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Signup failed', code: data.code },
        { 
          status: response.status,
          headers: responseHeaders
        }
      );
    }

    // Handle success response
    return NextResponse.json(
      { 
        message: data.message,
        redirectTo: data.redirectTo
      },
      { 
        status: 200,
        headers: responseHeaders
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'An error occurred during signup', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
} 