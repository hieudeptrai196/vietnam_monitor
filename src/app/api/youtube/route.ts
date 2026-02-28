import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET() {
  try {
    // Kênh Youtube VTV24: UCabsTV34JwALXKGMqHpvUiA
    const VTV24_CHANNEL_ID = 'UCabsTV34JwALXKGMqHpvUiA';
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${VTV24_CHANNEL_ID}`;

    const response = await fetch(rssUrl, {
      next: { revalidate: 1800 } // Cache 30 phút do Youtube upload khá nhiều
    });

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube RSS');
    }

    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const parsed = parser.parse(xmlData);

    let entries = parsed?.feed?.entry;
    if (!entries) {
      return NextResponse.json([]);
    }

    // Nếu chỉ có 1 video, fast-xml-parser sẽ parse thành Object thay vì Array
    if (!Array.isArray(entries)) {
      entries = [entries];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestVideos = entries.slice(0, 12).map((item: any) => {
      return {
        id: item['yt:videoId'],
        title: item.title,
        link: item.link?.['@_href'],
        published: item.published,
        thumbnail: item['media:group']?.['media:thumbnail']?.['@_url'] || 
                   `https://i3.ytimg.com/vi/${item['yt:videoId']}/hqdefault.jpg`,
        views: item['media:group']?.['media:community']?.['media:statistics']?.['@_views'] || 0
      };
    });

    return NextResponse.json(latestVideos);
  } catch (error) {
    console.error('YouTube RSS API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching YouTube data' },
      { status: 500 }
    );
  }
}
