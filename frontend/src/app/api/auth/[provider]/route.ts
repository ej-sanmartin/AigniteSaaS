import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = await Promise.resolve(params);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  console.log('OAuth provider:', provider);
  console.log('Backend URL:', backendUrl);
  
  // Get returnTo from URL
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';

  // Redirect to backend OAuth endpoint with returnTo parameter
  const redirectUrl = `${backendUrl}/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  console.log('Frontend redirecting to:', redirectUrl);
  
  return NextResponse.redirect(redirectUrl);
} 