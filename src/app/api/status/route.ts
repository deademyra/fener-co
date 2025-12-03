import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';

const API_KEY = process.env.API_FOOTBALL_KEY || '4b6087faf2421ea633eb2d01f80c501b';

export async function GET() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data.response);
  } catch (error) {
    console.error('[API Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API status' },
      { status: 500 }
    );
  }
}
