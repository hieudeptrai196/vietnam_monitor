import { NextResponse } from 'next/server';

const VIETNAM_CITIES = [
  { id: 'hn', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'hp', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'dn', name: 'Đà Nẵng', lat: 16.0678, lon: 108.2208 },
  { id: 'sg', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'ct', name: 'Cần Thơ', lat: 10.0280, lon: 105.7806 },
];

export async function GET() {
  try {
    const lats = VIETNAM_CITIES.map(c => c.lat).join(',');
    const lons = VIETNAM_CITIES.map(c => c.lon).join(',');
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FBangkok`;
    
    // Cache thời tiết khoảng 1 tiếng (3600 giây)
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      throw new Error('Failed to fetch from Open-Meteo API');
    }

    const data = await response.json();
    
    // Data trả về là mảng nếu request multiple coords
    const results = VIETNAM_CITIES.map((city, index) => {
      const cityData = Array.isArray(data) ? data[index] : data;
      const current = cityData.current;
      return {
        id: city.id,
        name: city.name,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        wind_speed: current.wind_speed_10m,
        weather_code: current.weather_code,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching weather data' },
      { status: 500 }
    );
  }
}
