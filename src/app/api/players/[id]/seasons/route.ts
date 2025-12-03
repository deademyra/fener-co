import { NextRequest, NextResponse } from 'next/server';
import { getPlayerSeasons } from '@/lib/api/client';

const CALLER_PAGE = '/api/players/[id]/seasons';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await getPlayerSeasons(parseInt(params.id), CALLER_PAGE);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player seasons:', error);
    return NextResponse.json({ response: [] }, { status: 500 });
  }
}
