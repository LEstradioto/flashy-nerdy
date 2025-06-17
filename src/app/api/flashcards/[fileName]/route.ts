import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/utils/auth';

interface RouteParams {
  params: Promise<{ fileName: string }>;
}

// GET /api/flashcards/:fileName
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    requireAuth(request);

    const { fileName } = await params;
    if (!fileName || fileName.includes('..')) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'flashcards', `${fileName}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    return NextResponse.json(json);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Error reading flashcard file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}