import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // API Chứng khoán ảo vì không có API open realtime free (thuờng cần token x-fi-session)
    // Mô phỏng 3 index chính
    const mockStockIndexes = [
      { id: 'vnindex', name: 'VN-INDEX', value: 1254.89, change: 15.23, percentChange: 1.23, volume: 856000000, value_vnd: 21500000000 },
      { id: 'hnx', name: 'HNX-INDEX', value: 235.12, change: -1.05, percentChange: -0.44, volume: 85000000, value_vnd: 1800000000 },
      { id: 'upcom', name: 'UPCOM-INDEX', value: 92.4, change: 0.5, percentChange: 0.54, volume: 42000000, value_vnd: 650000000 },
    ];

    return NextResponse.json(mockStockIndexes);
  } catch (error) {
    console.error('Stocks API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching stock prices' },
      { status: 500 }
    );
  }
}
