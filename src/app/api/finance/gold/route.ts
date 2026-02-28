import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Trong thực tế, có thể cào từ SJC, PNJ hoặc DOJI
    // Ở đây ta mô phỏng một API response giả định vì không có API open miễn phí cho giá vàng VN
    const baseGoldPrice = 83500000; // 83.5 triệu / lượng
    
    // Tạo data giả định với biến động ngẫu nhiên nhỏ dựa trên thời gian thực
    const mockGoldData = [
      { id: 'sjc-hcm', name: 'SJC Hồ Chí Minh', buy: baseGoldPrice - 2000000, sell: baseGoldPrice, change: 500000 },
      { id: 'sjc-hn', name: 'SJC Hà Nội', buy: baseGoldPrice - 2000000, sell: baseGoldPrice, change: 500000 },
      { id: 'pnj', name: 'PNJ', buy: baseGoldPrice - 2500000, sell: baseGoldPrice - 500000, change: 300000 },
      { id: 'doji', name: 'DOJI AV', buy: baseGoldPrice - 2000000, sell: baseGoldPrice, change: 500000 },
      { id: 'nhanz', name: 'Vàng nhẫn 9999', buy: 74500000, sell: 76500000, change: 200000 },
    ];

    return NextResponse.json(mockGoldData);
  } catch (error) {
    console.error('Gold API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching gold prices' },
      { status: 500 }
    );
  }
}
