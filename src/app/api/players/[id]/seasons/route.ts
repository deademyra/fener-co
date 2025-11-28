import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await apiClient.getPlayerSeasons(parseInt(params.id));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player seasons:', error);
    return NextResponse.json({ response: [] }, { status: 500 });
  }
}
