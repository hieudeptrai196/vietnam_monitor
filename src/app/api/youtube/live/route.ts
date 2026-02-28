import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache API 60 giây để tránh Rate Limit của YouTube

export async function GET() {
  try {
    const liveUrl = process.env.NEXT_PUBLIC_YOUTUBE_LIVE_URL;
    
    // Nếu Biến môi trường không được cấu hình, trả về false ngay lập tức
    if (!liveUrl) {
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
    }

    // Tiến hành cào nội dung HTML của link YouTube cấu hình
    const response = await fetch(liveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    const html = await response.text();

    // Dùng Regex quét chuỗi "isLiveNow":true đặc trưng của YT Video lúc phát sóng
    const isLive = html.includes('"isLiveNow":true');

    if (!isLive) {
      return NextResponse.json({ isLive: false });
    }

    // Nếu truyền link dạng Channel Live (Vd: youtube.com/@vtv24/live) thì chưa có videoId
    // Cần phải parse HTML tìm ra videoId đang live thực tế của luồng
    if (!videoId) {
      const matchId = html.match(/"videoId":"([^"]+)"/);
      if (matchId && matchId[1]) {
        videoId = matchId[1];
      }
    }

    // Nếu đang Live, bóc tách title từ meta tag og:title
    let title = 'Phát trực tiếp';
    if (isLive) {
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1];
      }
    }

    // Nếu đang Live và có Video ID, trả về link tự khởi chạy (Autoplay & Mute) cùng title
    if (isLive && videoId) {
      return NextResponse.json({
        isLive: true,
        title: title,
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
      });
    }

    return NextResponse.json({ isLive: false });
  } catch (error) {
    console.error('Error checking Youtube Live status:', error);
    return NextResponse.json({ isLive: false });
  }
}
