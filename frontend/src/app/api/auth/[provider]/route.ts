import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const redirectUrl = `${backendUrl}/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  return NextResponse.redirect(redirectUrl);
} 