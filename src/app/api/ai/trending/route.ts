import { NextResponse } from 'next/server';
import { extractTrendingKeywords } from '@/services/ai/trending';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articles } = body;

    if (!Array.isArray(articles)) {
      return NextResponse.json(
        { error: 'Invalid payload: articles must be an array' },
        { status: 400 }
      );
    }

    const trending = await extractTrendingKeywords(articles);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error('AI Trending API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching AI trending keywords' },
      { status: 500 }
    );
  }
}
