import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = requireAuth(request);

    const { fileName, data } = await request.json();

    if (!fileName || !data) {
      return NextResponse.json({ error: 'Missing fileName or data' }, { status: 400 });
    }

    const flashcardsDir = path.join(process.cwd(), 'public', 'flashcards');

    // Ensure directory exists
    if (!fs.existsSync(flashcardsDir)) {
      fs.mkdirSync(flashcardsDir, { recursive: true });
    }

    const filePath = path.join(flashcardsDir, `${fileName}.json`);

    // Write the JSON file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✅ File saved by ${user.username}: ${fileName}.json`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Error saving flashcard:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}