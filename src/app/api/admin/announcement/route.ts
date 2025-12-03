import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncement, setAnnouncement, resetAnnouncement, ContentType } from '@/lib/announcement';

export const dynamic = 'force-dynamic';

// GET - Fetch current announcement
export async function GET() {
  try {
    const announcement = getAnnouncement();
    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

// POST - Update announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, contentType, customTitle, showTitle, showBadge } = body;
    
    // Validate content type if provided
    const validContentTypes: ContentType[] = ['none', 'duyuru', 'reklam', 'haber', 'sponsor', 'ozel'];
    if (contentType && !validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }
    
    const announcement = setAnnouncement({
      html: typeof html === 'string' ? html : undefined,
      contentType: contentType as ContentType,
      customTitle: typeof customTitle === 'string' ? customTitle : undefined,
      showTitle: typeof showTitle === 'boolean' ? showTitle : undefined,
      showBadge: typeof showBadge === 'boolean' ? showBadge : undefined,
    });
    
    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

// DELETE - Reset to default announcement
export async function DELETE() {
  try {
    const announcement = resetAnnouncement();
    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error resetting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to reset announcement' },
      { status: 500 }
    );
  }
}
