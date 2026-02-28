import { NextResponse } from 'next/server';
import { summarizeNews } from '@/services/ai/summarizer';

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

    const summary = await summarizeNews(articles);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI Summarize API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching AI summary' },
      { status: 500 }
    );
  }
}
