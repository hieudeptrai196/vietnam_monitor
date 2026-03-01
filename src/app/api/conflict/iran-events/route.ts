import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Tự động revalidate sau 15 phút
export const revalidate = 900; 

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=Trung+%C4%90%C3%B4ng+OR+Iran+OR+Israel+OR+Gaza+OR+Lebanon+OR+Syria+when:7d&hl=vi&gl=VN&ceid=VN:vi'
];

// Danh sách các hotspot toạ độ nổ/xung đột dựa trên từ khoá
const HOTSPOTS = [
  { keywords: ['iran', 'tehran'], lat: 32.42, lng: 53.68, name: 'Iran' },
  { keywords: ['israel', 'tel aviv', 'jerusalem', 'do thái'], lat: 31.0461, lng: 34.8516, name: 'Israel' },
  { keywords: ['gaza', 'hamas', 'rafah', 'palestine'], lat: 31.4167, lng: 34.3333, name: 'Gaza Strip' },
  { keywords: ['lebanon', 'hezbollah', 'beirut', 'li-băng'], lat: 33.8547, lng: 35.8623, name: 'Lebanon' },
  { keywords: ['syria', 'damascus'], lat: 34.8021, lng: 38.9968, name: 'Syria' },
  { keywords: ['yemen', 'houthi', 'biển đỏ', 'red sea'], lat: 15.5527, lng: 48.5164, name: 'Yemen / Red Sea' },
  { keywords: ['trung đông', 'vùng vịnh'], lat: 29.2985, lng: 42.5510, name: 'Middle East' }
];

function assignHotspot(title: string) {
  const lowerTitle = title.toLowerCase();
  for (const hotspot of HOTSPOTS) {
    if (hotspot.keywords.some(kw => lowerTitle.includes(kw))) {
      return { lat: hotspot.lat, lng: hotspot.lng, locationName: hotspot.name };
    }
  }
  // Mặc định trả về Trung Đông chung
  const defaultHotspot = HOTSPOTS[HOTSPOTS.length - 1];
  return { lat: defaultHotspot.lat, lng: defaultHotspot.lng, locationName: defaultHotspot.name };
}

export async function GET() {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const fetchPromises = RSS_FEEDS.map(url => 
      fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VietnamMonitor/1.0)' },
        next: { revalidate: 900 } 
      }).then(res => res.text())
    );

    const rssTexts = await Promise.all(fetchPromises);
    const allEvents: Array<Record<string, unknown>> = [];

    for (const xmlData of rssTexts) {
      if (!xmlData || !xmlData.includes('<rss')) continue;

      const jsonObj = parser.parse(xmlData);
      const items = jsonObj?.rss?.channel?.item || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      itemsArray.forEach((item: any) => {
        const title = item.title || 'Không có tiêu đề';
        const link = item.link || '';
        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
        const source = item.source?.['#text'] || item.source || 'Tin tức';

        const { lat, lng, locationName } = assignHotspot(title);

        allEvents.push({
          id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
          title: title,
          category: 'Quân sự / Xung đột',
          sourceUrl: link,
          sourceName: source,
          latitude: lat,
          longitude: lng,
          locationName: locationName,
          timestamp: pubDate,
          severity: 'high' // Mặc định cảnh báo đỏ
        });
      });
    }

    // Sort theo thời gian mới nhất (dựa trên pubDate)
    allEvents.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    // Lấy tối đa 50 tin mới nhất để map không bị lag
    const topEvents = allEvents.slice(0, 50);

    return NextResponse.json({
      events: topEvents,
      scrapedAt: Date.now()
    });

  } catch (error: unknown) {
    console.error('Error fetching Middle East RSS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch conflict events', details: errorMessage },
      { status: 500 }
    );
  }
}
