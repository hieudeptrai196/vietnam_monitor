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
Bạn là một chuyên gia phân tích tình hình chiến sự thời sự và kinh tế vĩ mô. Lưu ý rằng xung đột tại Trung Đông không chỉ giới hạn trong các quốc gia khu vực (Iran, Israel, Lebanon, v.v.) mà còn có sự can dự sâu sắc của Mỹ, các nước đồng minh phương Tây và các cường quốc khác.
HÔM NAY LÀ: Ngày ${new Date().toLocaleDateString('vi-VN')} năm 2026. Mọi dự báo và phân tích phải lấy mốc thời gian này làm trung tâm.

Dưới đây là danh sách các tin tức mới nhất về khu vực Trung Đông / Vùng Vịnh và các bên liên quan:
${eventText}

Hãy viết một Báo Cáo Tóm Tắt Tình Hình ngắn gọn.
Yêu cầu BẮT BUỘC TRÌNH BÀY THEO CẤU TRÚC SAU (sử dụng dấu gạch đầu dòng "•"):

• Điểm nóng chiến sự: (Nêu bật các quốc gia/lực lượng liên quan, bao gồm cả Mỹ hoặc các nước khác nếu có, và sự kiện gì nổi cộm nhất đang diễn ra).
• Xu hướng tiếp theo: (Nhận định ngắn gọn về diễn biến chiến sự và động thái của các cường quốc sắp tới).
• Tác động giá Vàng: (Dự đoán giá vàng thế giới tăng/giảm/đi ngang và giải thích lý do, gắn với hệ quả kinh tế vĩ mô quốc tế).

Không viết thành đoạn văn dài. Trình bày các ý tách bạch, rõ ràng, dễ đọc. Giọng văn: Khách quan, báo chí, chuyên nghiệp.
    `.trim();

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // Đổi sang 8B cho tốc độ siêu nhanh
      temperature: 0.5,
      max_tokens: 450,
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
