import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/api-logger';

export async function GET() {
  try {
    const logs = apiLogger.getLogs();
    const stats = apiLogger.getStats();

    return NextResponse.json({
      logs,
      stats,
      count: logs.length,
    });
  } catch (error) {
    console.error('[Admin API Logs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API logs' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    apiLogger.clear();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin API Logs] Clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear API logs' },
      { status: 500 }
    );
  }
}
