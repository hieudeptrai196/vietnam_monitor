import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const liveUrl = process.env.NEXT_PUBLIC_YOUTUBE_LIVE_URL;
    
    // Nếu Biến môi trường không được cấu hình hoặc để trống, trả về false
    if (!liveUrl || liveUrl.trim() === '') {
      return NextResponse.json({ isLive: false });
    }

    let videoId = '';

    // Nhận diện Link truyền vào có chứa sẵn ID video cụ thể không
    if (liveUrl.includes('watch?v=')) {
      videoId = liveUrl.split('watch?v=')[1].split('&')[0];
    } else if (liveUrl.includes('youtu.be/')) {
      videoId = liveUrl.split('youtu.be/')[1].split('?')[0];
    } else if (liveUrl.includes('embed/')) {
      videoId = liveUrl.split('embed/')[1].split('?')[0];
    } else if (liveUrl.includes('/live')) {
      // Dạng channel/live, thử tách channel handle
      videoId = '';
    }

    // Nếu có videoId rõ ràng, trả về luôn (tin tưởng config của admin)
    if (videoId) {
      // Lấy title từ oEmbed API (nhẹ, không bị block)
      let title = 'Phát trực tiếp';
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = oembedData.title || title;
        }
      } catch {
        // Nếu oEmbed cũng lỗi thì dùng title mặc định
      }

      return NextResponse.json({
        isLive: true,
        title: title,
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
      });
    }

    // Nếu là dạng channel/live thì thử cào HTML (fallback)
    try {
      const response = await fetch(liveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'vi-VN,vi;q=0.9',
        }
      });
      const html = await response.text();
      const isLive = html.includes('"isLiveNow":true');
      
      if (isLive) {
        const matchId = html.match(/"videoId":"([^"]+)"/);
        if (matchId && matchId[1]) {
          let title = 'Phát trực tiếp';
          const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
          if (titleMatch) title = titleMatch[1];
          
          return NextResponse.json({
            isLive: true,
            title,
            videoId: matchId[1],
            embedUrl: `https://www.youtube.com/embed/${matchId[1]}?autoplay=1&mute=1`
          });
        }
      }
    } catch {
      // Nếu cào bị chặn (Vercel/Cloud), bỏ qua
    }

    return NextResponse.json({ isLive: false });
  } catch (error) {
    console.error('Error checking Youtube Live status:', error);
    return NextResponse.json({ isLive: false });
  }
}
