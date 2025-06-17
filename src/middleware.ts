import { NextRequest, NextResponse } from 'next/server';

// Block direct static access to flashcard JSON files.
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/flashcards/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/flashcards/:path*'],
};