import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Lấy dữ liệu động đất 30 ngày qua trên toàn cầu từ USGS (Miễn phí, Open Data, cập nhật mỗi phút)
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson', {
      next: { revalidate: 1800 } // cache 30 phút
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from USGS API');
    }

    const data = await response.json();
    
    // Lọc động đất ảnh hưởng khu vực Việt Nam và lân cận
    // Bounding box tương đối VN: Vĩ độ(Lat): 8.0 đến 24.0 | Kinh độ(Lng): 102.0 đến 110.0
    // Mở rộng ra ĐNÁ để lấy context
    const minLat = 5.0;
    const maxLat = 25.0;
    const minLng = 95.0;
    const maxLng = 115.0;

    interface EarthquakeFeature {
      id: string;
      properties: {
        title: string;
        mag: number;
        time: number;
        url: string;
      };
      geometry: {
        coordinates: [number, number, number];
      };
    }

    const regionalQuakes = data.features.filter((feature: EarthquakeFeature) => {
      const [lng, lat] = feature.geometry.coordinates; // USGS uses [longitude, latitude, depth]
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });

    // Format lại dữ liệu cho Map
    const formattedQuakes = regionalQuakes.map((feature: EarthquakeFeature) => ({
      id: feature.id,
      title: feature.properties.title,
      mag: feature.properties.mag,
      time: feature.properties.time, // unix timestamp
      url: feature.properties.url,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2]
    }));

    return NextResponse.json(formattedQuakes);
  } catch (error) {
    console.error('Earthquake API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching earthquake data' },
      { status: 500 }
    );
  }
}
