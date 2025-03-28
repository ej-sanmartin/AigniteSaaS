import { NextResponse } from 'next/server';
import api from '@/utils/api';

export async function GET() {
  try {
    const { data } = await api.get('/auth/check');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
} 