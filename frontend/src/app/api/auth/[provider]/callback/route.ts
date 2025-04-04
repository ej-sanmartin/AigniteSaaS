import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';
  const error = url.searchParams.get('error');
  const baseUrl = url.origin;

  // Handle error case
  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error)}`);
  }

  // Simply redirect to the return URL
  // The middleware will handle auth check and redirect if needed
  return NextResponse.redirect(`${baseUrl}${returnTo}`);
} 