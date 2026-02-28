import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET() {
  try {
    // API GDACS: Global Disaster Alert and Coordination System (LHQ & EU)
    // Cung cấp cảnh báo thiên tai (Lũ lụt, Bão, Động đất, Nuí lửa,...) trong 7 ngày qua
    const response = await fetch('https://gdacs.org/xml/rss_7d.xml', {
      next: { revalidate: 3600 } // cache 1 giờ vì GDACS không cập nhật quá liên tục
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from GDACS API');
    }

    const xmlData = await response.text();
    const parser = new XMLParser();
    const parsed = parser.parse(xmlData);

    const items = parsed?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) {
      return NextResponse.json([]);
    }

    // Bounding box chuẩn cho biên giới Việt Nam
    const minLat = 8.0;
    const maxLat = 24.0;
    const minLng = 102.0;
    const maxLng = 110.0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const regionalDisasters = items.filter((item: any) => {
      // Bỏ qua động đất vì ta đã dùng API riêng của USGS (hoặc giữ lại tùy ý, nhưng USGS chi tiết hơn)
      if (item['gdacs:eventtype'] === 'EQ') return false; 

      const point = item['geo:Point'];
      if (!point) return false;

      const lat = parseFloat(point['geo:lat']);
      const lng = parseFloat(point['geo:long']);

      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedDisasters = regionalDisasters.map((item: any) => {
      const point = item['geo:Point'];
      
      return {
        id: item.guid || item['gdacs:eventid'],
        title: item.title,
        description: item.description,
        type: item['gdacs:eventtype'], // FL: Flood, TC: Cyclone, DR: Drought, WF: WildFire, VO: Volcano
        level: item['gdacs:alertlevel'], // Red, Orange, Green
        lat: parseFloat(point['geo:lat']),
        lng: parseFloat(point['geo:long']),
        date: item.pubDate,
        url: item.link
      };
    });

    return NextResponse.json(formattedDisasters);
  } catch (error) {
    console.error('Disasters API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching disasters data' },
      { status: 500 }
    );
  }
}
