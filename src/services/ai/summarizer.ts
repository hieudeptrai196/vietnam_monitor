import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_api_key_to_avoid_crash_on_instantiation',
});

interface NewsArticle {
  title: string;
  source: string;
  pubDate: string;
}

export async function summarizeNews(articles: NewsArticle[]): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return "Tính năng tóm tắt AI đang tạm tắt vì chưa cấu hình GROQ_API_KEY.";
  }

  if (articles.length === 0) {
    return "Không có tin tức nào để tóm tắt.";
  }

  const articlesText = articles
    .slice(0, 10) // Tối đa 10 tin để tránh quá tải token
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title} (${new Date(a.pubDate).toLocaleString('vi-VN')})`)
    .join('\n');

  const prompt = `Bạn là một trợ lý AI chuyên phân tích tin tức tình báo và sự kiện tại Việt Nam.
Hãy đọc danh sách các tiêu đề tin tức mới nhất dưới đây và viết một đoạn tóm tắt ngắn gọn (khoảng 3-4 câu) về tình hình chung đang diễn ra.
Hãy tập trung vào các sự kiện quan trọng nhất (chính trị, kinh tế, xã hội, thiên tai). 
Viết bằng tiếng Việt, văn phong chuyên nghiệp, khách quan.

Danh sách tin tức:
${articlesText}

Tóm tắt tình hình:`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Bạn là chuyên gia phân tích tin tức.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Cần sự chính xác và nhất quán
      max_tokens: 300,
    });

    return chatCompletion.choices[0]?.message?.content || "Không thể tạo tóm tắt vào lúc này.";
  } catch (error) {
    console.error("Lỗi khi gọi Groq API:", error);
    return "Hệ thống AI đang quá tải hoặc gặp sự cố. Vui lòng thử lại sau.";
  }
}
