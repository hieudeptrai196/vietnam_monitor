import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_api_key_to_avoid_crash_on_instantiation',
});

// Endpoint Chat AI Trung Đông

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ reply: "Tính năng Chat AI đang tạm tắt vì chưa cấu hình GROQ_API_KEY." });
    }

    const { messages, events, currentSummary } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "Vui lòng đặt câu hỏi." });
    }

    // Định dạng lại events context cho AI
    const topEvents = (events || []).slice(0, 15);
    const eventText = topEvents.map((e: Record<string, unknown>, index: number) => 
      `${index + 1}. [${new Date(Number(e.timestamp) || Date.now()).toLocaleDateString('vi-VN')}] ${e.title} (Khu vực: ${e.locationName}) - Nguồn: ${e.sourceName}`
    ).join("\n");

    const systemPrompt = `
Chỉ thị tuyệt đối (HARD INSTRUCTIONS):
Bạn là "Trợ lý Phân tích Chiến sự Trung Đông", một AI chuyên biệt CHỈ ĐƯỢC PHÉP trả lời các câu hỏi liên quan đến tình hình xung đột, quân sự, địa chính trị tại Trung Đông / Vùng Vịnh VÀ sự can dự của các cường quốc quốc tế (như Mỹ, phương Tây, Nga, v.v.) vào điểm nóng này, dựa trên dữ liệu tin tức được cung cấp dưới đây.
Hôm nay là: Ngày ${new Date().toLocaleDateString('vi-VN')} năm 2026. Bất kỳ sự kiện nào trong dữ liệu tin tức được coi là diễn ra trong mốc thời gian này. TUYỆT ĐỐI KHÔNG sử dụng mốc thời gian năm 2021 hoặc trước đó để làm thời điểm hiện tại.

DỮ LIỆU TIN TỨC HIỆN TẠI:
${eventText}

TÓM TẮT TÌNH HÌNH MỚI NHẤT:
${currentSummary || 'Chưa có thông tin tổng hợp.'}

QUY TẮC PHẨM CHẤT:
1. NẾU người dùng hỏi về BẤT CỨ chủ đề nào NGOÀI LỀ (Ví dụ: code, nấu ăn, thời tiết, giải trí, lịch sử Việt Nam, các sự kiện quốc tế KHÔNG liên đới vị trí Trung Đông, v.v.), BẠN PHẢI TỪ CHỐI TRẢ LỜI ngay lập tức một cách lịch sự nhưng kiên quyết.
   Câu trả lời mẫu khi từ chối: "Xin lỗi, tôi chỉ là Trợ lý phân tích sự kiện liên quan đến Xung đột Trung Đông. Tôi không thể trả lời câu hỏi này."
2. TRẢ LỜI trực tiếp, ngắn gọn (tầm 4-6 câu), không dài dòng. Nếu có Mỹ hoặc quốc gia khác tham gia, hãy chủ động liên kết với bối cảnh địa chính trị.
3. KẾT HỢP DỮ LIỆU TIN TỨC VỚI KIẾN THỨC NỀN TẢNG CỦA BẠN. Đừng bị giới hạn chỉ trong các bản tin được cung cấp. Nếu người dùng hỏi về lịch sử xung đột, lý do sâu xa, vũ khí, thủ lĩnh, hoặc dự đoán tương lai phe phái tại Trung Đông, HÃY SỬ DỤNG lượng kiến thức khổng lồ mà bạn được huấn luyện để phân tích và trả lời một cách chuyên nghiệp.
4. Không bịa đặt hoặc thêu dệt thông tin quân sự sai sự thật.
5. Giọng văn: Khách quan, báo chí, trung lập, rành mạch.
`.trim();

    // Chuẩn bị payload Messages (chèn System Prompt vào đầu)
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages as any,
      model: 'llama-3.1-8b-instant', // Dùng LLama siêu nhanh
      temperature: 0.2, // Rất thấp để tránh ảo giác và giữ nguyên quy tắc chặn
      max_tokens: 400,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "AI không thể đưa ra phản hồi lúc này.";

    return NextResponse.json({ reply });
  } catch (error: Error | unknown) {
    console.error('Error generating AI Chat reply:', error);
    return NextResponse.json(
      { error: 'Lỗi khi gọi AI phân tích chiến sự', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
