import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/utils/auth';

// GET /api/flashcards/manifest
export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated
    requireAuth(request);

    const manifestPath = path.join(process.cwd(), 'data', 'flashcards', 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ files: [] });
    }

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const json = JSON.parse(raw);

    return NextResponse.json(json);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Error reading manifest.json:', error);
    return NextResponse.json({ error: 'Failed to read manifest' }, { status: 500 });
  }
}