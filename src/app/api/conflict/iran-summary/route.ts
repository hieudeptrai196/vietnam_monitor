import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_api_key_to_avoid_crash_on_instantiation',
});

// Cache đơn giản trong memory để tránh spam API
let summaryCache = {
  text: "",
  timestamp: 0
};

// 10 phút cache (600.000 ms)
const CACHE_TTL = 600000;

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ summary: "Tính năng tóm tắt AI đang tạm tắt vì chưa cấu hình GROQ_API_KEY." });
    }

    const { events, forceRefresh } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ summary: "Không có đủ dữ liệu sự kiện để tóm tắt." });
    }

    const now = Date.now();
    // Bỏ qua cache nếu có cờ `forceRefresh` true
    if (!forceRefresh && summaryCache.text && now - summaryCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ summary: summaryCache.text, cached: true });
    }

    // Lấy tối đa 15 tin mới nhất để prompt không quá dài
    const topEvents = events.slice(0, 15);
    const eventText = topEvents.map((e: Record<string, unknown>, index: number) => 
      `${index + 1}. [${new Date(Number(e.timestamp) || Date.now()).toLocaleDateString('vi-VN')}] ${e.title} (Khu vực: ${e.locationName})`
    ).join("\n");

    const prompt = `
Bạn là một chuyên gia phân tích tình hình chiến sự thời sự. Dưới đây là danh sách các tin tức mới nhất về khu vực Trung Đông / Vùng Vịnh:
${eventText}

Hãy viết một Báo Cáo Tóm Tắt Tình Hình (khoảng 3-4 câu ngắn gọn, súc tích).
Yêu cầu:
- Nêu bật điểm nóng nhất (quốc gia nào, sự kiện gì nổi cộm).
- Không liệt kê lại từng số thứ tự.
- Giọng văn: Khách quan, báo chí, chuyên nghiệp.
    `.trim();

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile', // Mô hình lớn tốt cho phân tích
      temperature: 0.3,
      max_tokens: 256,
    });

    const summary = chatCompletion.choices[0]?.message?.content || "Không thể tạo tóm tắt vào lúc này.";

    // Lưu cache
    summaryCache = {
      text: summary,
      timestamp: now
    };

    return NextResponse.json({ summary });

  } catch (error: unknown) {
    console.error('Error generating AI summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate summary', details: errorMessage },
      { status: 500 }
    );
  }
}
