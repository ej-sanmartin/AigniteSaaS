import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { provider: string } }
) {
  // Await the params object
  const { provider } = await Promise.resolve(params);

  // Make sure BACKEND_URL is defined
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  try {
    // Redirect to backend OAuth endpoint
    return NextResponse.redirect(`${backendUrl}/api/auth/${provider}`);
  } catch (error) {
    console.error('OAuth error:', error);
    // Redirect to login with error message
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    );
  }
} 