import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Phân tích tham số path để có thể tải các sub-resources (JS/CSS) nếu cần
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    
    // Ghép URL gốc của Cục Khí tượng Thuỷ văn
    const targetUrl = `https://vndms.dmc.gov.vn${path}`;
    
    // 2. Fake Header giống Browser thật để tránh bị hệ thống chặn Anti-Bot
    const headers = new Headers({
      'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': request.headers.get('Accept') || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': request.headers.get('Accept-Language') || 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    });

    if (request.headers.get('Referer')) {
      headers.set('Referer', targetUrl);
    }

    // 3. Tiến hành gọi Request Server-to-Server
    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
    });

    // 4. Lấy nội dung trả về
    let body: ArrayBuffer | Uint8Array = await res.arrayBuffer();

    // Sửa các đường dẫn tương đối (absolute paths) trong file HTML/CSS/JS 
    // sang đường dẫn trỏ về chính proxy API của chúng ta nếu cần thiết.
    // Tuy nhiên, với trang này, chèn base URL là cách hiệu quả nhất để giữ JS/CSS chạy:
    if (res.headers.get('content-type')?.includes('text/html')) {
        const textDecoder = new TextDecoder('utf-8');
        let htmlContent = textDecoder.decode(body);
        
        // Chèn thẻ <base> vào ngay sau thẻ <head> để trình duyệt tự hiểu 
        // toàn bộ các resources (/css, /js, /images) đều nằm trên https://vndms.dmc.gov.vn
        // Đồng thời, chèn thêm CSS để ẩn Header gốc của họ đi cho gọn bản đồ
        const hideHeaderCss = `
          <style>
            header, .header, #header { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; }
            footer, .footer, #footer, .modal-footer { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; border:none !important; }
            .form-search-top { display: none !important; }
            /* Căn lại vị trí của nội dung dưới header nếu bị đẩy */
            body.format-top { padding-top: 0 !important; }
            .app { top: 0 !important; height: 100vh !important; }
            .btn-view-map { top: 10px !important; }
          </style>
        `;
        
        htmlContent = htmlContent.replace('<head>', '<head><base href="https://vndms.dmc.gov.vn/">' + hideHeaderCss);
        
        const textEncoder = new TextEncoder();
        body = textEncoder.encode(htmlContent);
    }

    // 5. Cài đặt lại Header phản hồi
    const proxiedHeaders = new Headers();
    res.headers.forEach((value, key) => {
      // LOẠI BỎ thuộc tính quan trọng này để cho phép nhúng iFrame
      if (key.toLowerCase() !== 'x-frame-options' && key.toLowerCase() !== 'content-security-policy') {
        proxiedHeaders.set(key, value);
      }
    });
    
    // Nếu Content-Encoding đang là br/gzip/deflate làm hỏng format utf-8 khi mình sửa HTML ở bước 4
    // Mình đã parse content về ArrayBuffer nguyên thủy nên xoá luôn header nén đi cho chắc.
    if (res.headers.get('content-type')?.includes('text/html')) {
        proxiedHeaders.delete('content-encoding');
        proxiedHeaders.delete('content-length');
    }

    // Cho phép Origin gọi đến
    proxiedHeaders.set('Access-Control-Allow-Origin', '*');

    // 6. Trả về Response cho ứng dụng Next.js
    return new NextResponse(body as BodyInit, {
      status: res.status,
      headers: proxiedHeaders,
    });

  } catch (error) {
    console.error("Lỗi khi tải dữ liệu DMC qua Proxy:", error);
    return NextResponse.json(
      { error: "Internal Server Error - Proxy Failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
