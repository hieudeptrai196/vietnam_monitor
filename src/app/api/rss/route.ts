import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get('url');

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'Missing feed URL parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(feedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VietnamMonitor-RSS-Fetcher/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return new NextResponse(xmlText, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('RSS Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching RSS feed' },
      { status: 500 }
    );
  }
}
