import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { XMLParser } from 'fast-xml-parser';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'fallback',
});

// Hàm công cụ để tra cứu Google News
async function searchGoogleNews(query: string) {
  try {
    const response = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=vi&gl=VN&ceid=VN:vi`);
    if (!response.ok) return "Không tìm thấy kết quả từ Google News.";
    
    const xml = await response.text();
    const parser = new XMLParser();
    const result = parser.parse(xml);
    const items = result.rss?.channel?.item;
    
    if (!items) return "Không có tin tức nào.";
    
    const itemsArray = Array.isArray(items) ? items : [items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topItems = itemsArray.slice(0, 3).map((item: any) => ({
      title: item.title,
      pubDate: item.pubDate
    }));
    
    return JSON.stringify(topItems);
  } catch (error) {
    console.error("Tra cứu lỗi:", error);
    return "Lỗi khi tra cứu mạng.";
  }
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ reply: "Lỗi hệ thống: Chưa cấu hình Groq API." }, { status: 500 });
  }

  try {
    const { messages, events, currentSummary } = await req.json();

    const topEvents = (events || []).slice(0, 15);
    const eventText = topEvents.map((e: Record<string, unknown>, index: number) => 
      `${index + 1}. [${new Date(Number(e.timestamp) || Date.now()).toLocaleDateString('vi-VN')}] ${e.title} (Khu vực: ${e.locationName}) - Nguồn: ${e.sourceName}`
    ).join("\n");

    const systemPrompt = `
Chỉ thị tuyệt đối (HARD INSTRUCTIONS):
Bạn là "Trợ lý Phân tích Chiến sự Trung Đông". Bạn CHỈ ĐƯỢC PHÉP trả lời các câu hỏi liên quan đến tình hình xung đột, quân sự, địa chính trị tại Trung Đông và sự can dự của quốc tế.

Hôm nay là: Ngày ${new Date().toLocaleDateString('vi-VN')} năm 2026. Bất kỳ sự kiện nào đều lấy mốc này làm thời điểm hiện tại.

DỮ LIỆU TIN TỨC HIỆN TẠI TRÊN MÀN HÌNH CỦA NGƯỜI DÙNG:
${eventText}
TÓM TẮT DỮ LIỆU: ${currentSummary || 'Chưa có thông tin'}

QUY TẮC TRẢ LỜI:
1. TỪ CHỐI NGOÀI LỀ (Ưu tiên Cao nhất): Nếu người dùng hỏi các chủ đề KHÔNG LIÊN QUAN ĐẾN Xung đột Trung Đông (như lập trình, viết code, thời tiết, giải trí, chứng khoán, Việt Nam, chào hỏi linh tinh...), BẠN PHẢI TỪ CHỐI TỨC THÌ. KHÔNG ĐƯỢC PHÉP TRA CỨU. Ví dụ: "Xin lỗi, tôi chỉ là trợ lý phân tích thuộc dự án Vietnam Monitor, chuyên giải đáp về tình hình Trung Đông."
2. TRA CỨU MẠNG (Chỉ áp dụng cho chủ đề Trung Đông): NẾU người dùng hỏi một sự kiện Trung Đông MÀ TRONG DỮ LIỆU BÊN TRÊN KHÔNG CÓ (như kiến thức, lịch sử, nhân vật, sự kiện cũ), bạn TUYỆT ĐỐI KHÔNG được tự "chém gió". Thay vào đó, bạn PHẢI trả về chính xác chuỗi dấu hiệu sau để hệ thống tự đi tìm:
[SEARCH_REQUIRED] <Từ khóa tìm kiếm trên Google News>
Ví dụ: [SEARCH_REQUIRED] Lịch sử Israel Gaza
3. NẾU TRONG DỮ LIỆU ĐÃ CÓ ĐỦ: Trả lời trực tiếp, ngắn gọn (4-6 câu), văn phong báo chí khách quan.
`.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    let reply = "";

    try {
      const chatCompletion = await groq.chat.completions.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: apiMessages as any,
        model: 'llama-3.1-8b-instant', // Model nhanh để phán đoán
        temperature: 0.1,
        max_tokens: 500,
      });
      reply = chatCompletion.choices[0]?.message?.content || "";
    } catch (e) {
      console.error("Lỗi gọi Groq API lần 1:", e);
      return NextResponse.json({ reply: "Lỗi kết nối bộ não AI (Lần 1)." }, { status: 500 });
    }

    // Nếu AI yêu cầu tra cứu thêm
    if (reply.includes("[SEARCH_REQUIRED]")) {
      const query = reply.replace("[SEARCH_REQUIRED]", "").trim() || messages[messages.length - 1].content;
      console.log("AI is manually searching Web for:", query);
      
      const searchResults = await searchGoogleNews(query);
      
      // Đút dữ liệu mới tìm được vào và bắt AI rep lại
      apiMessages.push({ role: 'assistant', content: reply });
      apiMessages.push({ 
        role: 'system', 
        content: `HỆ THỐNG ĐÃ TRẢ VỀ KẾT QUẢ TỪ INTERNET CHO TỪ KHÓA '${query}':\n${searchResults}\n\nHãy sử dụng thông tin này kết hợp với hiểu biết của bạn để trả lời câu hỏi của người dùng ngay bây giờ. KHÔNG DÙNG LẠI TỪ KHÓA SEARCH NỮA.` 
      });

      try {
        const chatCompletion2 = await groq.chat.completions.create({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: apiMessages as any,
          model: 'llama-3.3-70b-versatile', // Dùng 70B siêu thông minh để tổng hợp câu trả lời cuối
          temperature: 0.2,
          max_tokens: 500,
        });
        reply = chatCompletion2.choices[0]?.message?.content || "";
      } catch (e) {
        console.error("Lỗi gọi Groq API lần 2 (Đọc tin tra cứu web):", e);
        return NextResponse.json({ reply: "Lỗi kết nối bộ não AI (Lần 2 sau khi Web Search)." }, { status: 500 });
      }
    }

    return NextResponse.json({ reply });

  } catch (error: unknown) {
    console.error("---------------------");
    console.error("Lỗi AI Chat chi tiết:", error);
    console.error("---------------------");
    return NextResponse.json({ reply: "Xin lỗi, đã xảy ra lỗi từ server khi phân tích." }, { status: 500 });
  }
}
