import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_api_key_to_avoid_crash_on_instantiation',
});

interface NewsArticle {
  title: string;
}

export interface TrendingTopic {
  keyword: string;
  context: string;
}

export async function extractTrendingKeywords(articles: NewsArticle[]): Promise<TrendingTopic[]> {
  if (!process.env.GROQ_API_KEY) {
    return [
      { keyword: "AI", context: "Chưa cấu hình API Key để phân tích" }
    ];
  }

  if (articles.length === 0) {
    return [];
  }

  const titles = articles.slice(0, 15).map(a => a.title).join('\n');

  const prompt = `Bạn là hệ thống AI phân tích xu hướng tin tức Việt Nam. Đọc danh sách các tiêu đề tin tức mới nhất này và trích xuất RA ĐÚNG 5 "TỪ KHÓA THỊNH HÀNH" (trending keywords/topics) xuất hiện nhiều nhất hoặc quan trọng nhất. 
Trích xuất những danh từ riêng, sự kiện cụ thể (ví dụ: "Bão Yagi", "Giá vàng SJC", "Luật Đất đai").

Trả về ĐÚNG định dạng JSON array chứa các object, KHÔNG có văn bản nào khác. Ví dụ:
[
  { "keyword": "Giá vàng", "context": "Liên tục biến động mạnh, tăng sát mốc 80 triệu/lượng" }
]

Danh sách tiêu đề:
${titles}

Output JSON (đảm bảo JSON hợp lệ 100%):`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You reply with strictly valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1, // Cần sự chính xác form JSON
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Parse json
    try {
      // Vì Groq hỗ trợ json_object, kết quả thường đóng trong object { "trending": [...] }
      // Ta cần bóc xuất mảng
      const parsed = JSON.parse(responseContent);
      let results: TrendingTopic[] = [];
      
      // Xử lý các pattern khác nhau mà LLaMA có thể sinh ra
      if (Array.isArray(parsed)) {
        results = parsed;
      } else {
        const firstKey = Object.keys(parsed)[0];
        if (firstKey && Array.isArray(parsed[firstKey])) {
          results = parsed[firstKey];
        } else if (parsed.keywords && Array.isArray(parsed.keywords)) {
          results = parsed.keywords;
        } else if (parsed.topics && Array.isArray(parsed.topics)) {
          results = parsed.topics;
        }
      }

      return results.slice(0, 5); // Chỉ lấy tối đa 5

    } catch (parseError) {
      console.error("Lỗi parse JSON từ Groq:", parseError, responseContent);
      return [];
    }
  } catch (error) {
    console.error("Lỗi khi gọi Groq API Trending:", error);
    return [];
  }
}
