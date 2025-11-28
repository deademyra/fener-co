import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const season = searchParams.get('season') || new Date().getFullYear();
  
  try {
    const response = await apiClient.getPlayerStatistics(parseInt(params.id), Number(season));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player statistics:', error);
    return NextResponse.json({ response: [] }, { status: 500 });
  }
}
