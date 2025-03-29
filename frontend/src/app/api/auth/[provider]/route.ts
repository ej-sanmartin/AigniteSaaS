import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  // Await the params object
  const { provider } = await Promise.resolve(params);
  
  // Get returnTo from URL
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';

  try {
    // Redirect to backend OAuth endpoint with returnTo parameter
    return NextResponse.redirect(
      `${process.env.BACKEND_URL}/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`
    );
  } catch (error) {
    // Redirect to login with error message
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    );
  }
} 