import { NextRequest, NextResponse } from 'next/server';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

export const revalidate = 86400; // 24 hours - seasons don't change often

export async function GET(request: NextRequest) {
  try {
    // Fetch real seasons from API-Football
    const response = await fetch(
      `https://v3.football.api-sports.io/teams/seasons?team=${FENERBAHCE_TEAM_ID}`,
      {
        headers: {
          'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch seasons from API');
    }
    
    const data = await response.json();
    
    // API returns array of years: [2011, 2012, ..., 2025]
    const seasons: number[] = data.response || [];
    
    // Sort descending (newest first)
    const sortedSeasons = [...seasons].sort((a, b) => b - a);
    
    // Calculate current season
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // If we're past August, current season is currentYear
    // Otherwise, current season started last year
    const currentSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
    
    return NextResponse.json({ 
      seasons: sortedSeasons,
      currentSeason 
    });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    
    // Fallback: Generate seasons from 2011 to current year
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
    
    const fallbackSeasons: number[] = [];
    for (let year = currentSeason; year >= 2011; year--) {
      fallbackSeasons.push(year);
    }
    
    return NextResponse.json({ 
      seasons: fallbackSeasons,
      currentSeason
    });
  }
}
