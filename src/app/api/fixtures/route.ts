import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const team = searchParams.get('team');
  const season = searchParams.get('season') || new Date().getFullYear();
  
  if (!team) {
    return NextResponse.json({ response: [] }, { status: 400 });
  }
  
  try {
    const response = await apiClient.getFixtures(parseInt(team), Number(season));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json({ response: [] }, { status: 500 });
  }
}
