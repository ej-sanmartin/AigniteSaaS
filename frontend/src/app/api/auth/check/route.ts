import { NextResponse } from 'next/server';
import api from '@/utils/api';

export async function GET() {
  try {
    console.log('Auth check: Forwarding request to backend');
    const { data } = await api.get('/auth/check');
    console.log('Auth check: Successfully verified token');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
} 