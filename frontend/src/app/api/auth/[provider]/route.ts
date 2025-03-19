import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider;
  
  // Make sure BACKEND_URL is defined
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  return Response.redirect(
    `${backendUrl}/auth/${provider}`
  );
} 