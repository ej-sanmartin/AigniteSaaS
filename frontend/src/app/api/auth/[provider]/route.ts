import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider;
  return Response.redirect(
    `${process.env.BACKEND_URL}/auth/${provider}`
  );
} 