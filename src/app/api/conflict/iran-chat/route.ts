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
Bạn là "Trợ lý Phân tích Chiến sự Trung Đông", một AI chuyên biệt CHỈ ĐƯỢC PHÉP trả lời các câu hỏi liên quan đến tình hình xung đột, quân sự, địa chính trị tại Trung Đông / Vùng Vịnh VÀ sự can dự của các cường quốc quốc tế (như Mỹ, phương Tây, Nga, v.v.) vào điểm nóng này.

Hôm nay là: Ngày ${new Date().toLocaleDateString('vi-VN')} năm 2026. Bất kỳ sự kiện hoặc tra cứu nào đều lấy mốc này làm tâm. TUYỆT ĐỐI KHÔNG sử dụng mốc thời gian năm 2021.

DỮ LIỆU TIN TỨC HIỆN TẠI (Tình hình mới nhất):
${eventText}
TÓM TẮT: ${currentSummary || 'Chưa có thông tin'}

QUY TẮC PHẨM CHẤT:
1. NẾU người dùng hỏi về BẤT CỨ chủ đề nào NGOÀI LỀ (Ví dụ: code, thời tiết, giải trí, lịch sử Việt Nam, các sự kiện KHÔNG liên đới Trung Đông), BẠN PHẢI TỪ CHỐI TRẢ LỜI ngay lập tức một cách lịch sự nhưng kiên quyết.
2. NẾU CẦN THÊM THÔNG TIN (Ví dụ người dùng hỏi về một sự kiện, nhân vật, lịch sử không có trong BẢN TIN HIỆN TẠI, hoặc hỏi về thông tin mới nhất trên mạng), HÃY CHỦ ĐỘNG GỌI CÔNG CỤ \`search_news\` ĐỂ TRA CỨU. TUYỆT ĐỐI KHÔNG được tự ý "chém gió" hay bịa đặt dựa trên trí nhớ cũ của bạn.
3. TRẢ LỜI trực tiếp, ngắn gọn (4-6 câu), phong cách báo chí khách quan.
`.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "search_news",
          description: "Dùng để tra cứu tin tức mới nhất từ Google News hoặc các bối cảnh lịch sử, địa chính trị liên quan đến Trung Đông khi người dùng hỏi.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Từ khóa tìm kiếm ngắn gọn trên Google News (Ví dụ: 'Tình hình Israel Hamas mới nhất', 'Tổng thống Mỹ hiện tại là ai', 'Lịch sử xung đột Iran Israel')"
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    let chatCompletion = await groq.chat.completions.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: apiMessages as any,
      model: 'llama-3.3-70b-versatile', // Dùng 70B cho Tool Calling chính xác nhất
      temperature: 0.1,
      max_tokens: 500,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
      tool_choice: "auto"
    });

    const responseMessage = chatCompletion.choices[0]?.message;

    // Kích hoạt Tool Calling nếu AI yều cầu
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      apiMessages.push(responseMessage); // Add assistant's tool call request

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'search_news') {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          console.log("AI is searching Web for:", functionArgs.query);
          const searchResults = await searchGoogleNews(functionArgs.query);
          
          apiMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "search_news",
            content: searchResults,
          });
        }
      }

      // Gọi lại Groq lần 2 cùng với kết quả tra cứu web
      chatCompletion = await groq.chat.completions.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: apiMessages as any,
        model: 'llama-3.1-8b-instant', // Gọi lại bằng 8B cho nhanh gọn
        temperature: 0.2,
        max_tokens: 500,
      });
    }

    const reply = chatCompletion.choices[0]?.message?.content || "AI không thể đưa ra phản hồi lúc này.";

    return NextResponse.json({ reply });

  } catch (error: unknown) {
    console.error("Lỗi AI Chat:", error);
    return NextResponse.json({ reply: "Hệ thống AI đang bận kết nối web hoặc quá tải, vui lòng thử lại sau." }, { status: 500 });
  }
}
