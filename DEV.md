# 🇻🇳 Vietnam Monitor - System Documentation

Vietnam Monitor (Trung tâm Giám sát Việt Nam) là một nền tảng Dashboard cung cấp số liệu tổng hợp chuyên sâu theo thời gian thực (Real-time) cho lãnh thổ Việt Nam. Hệ thống tập trung thống kê dữ liệu liên quan đến Thiên tai, Báo chí, Tài chính, Thị trường và Thời tiết trên một màn hình Giám sát duy nhất (Single-pane of glass).

---

## 🚀 Công nghệ sử dụng (Tech Stack)

Dự án áp dụng kiến trúc **BFF (Backend-For-Frontend)** thông qua Next.js Route Handlers để ẩn giấu API Keys, vượt qua giới hạn CORS từ các dịch vụ bên thứ ba và giảm tải xử lý dữ liệu (XML to JSON) cho trình duyệt của người dùng.

### Cốt lõi

- **Framework Chính**: [Next.js 16](https://nextjs.org/) (App Router + React Client Components)
- **UI & Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (kết hợp `persist` middleware để lưu trạng thái bật/tắt các Panel vào `localStorage`).
- **Bản đồ Tương tác**: [MapLibre GL JS](https://maplibre.org/)
- **Data Parser**: [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser) (Xử lý lượng lớn XML/RSS thành mảng JSON).
- **AI Integration**: [Groq SDK](https://console.groq.com/) (Sử dụng Model Llama 3 8B để tóm tắt văn bản tốc độ cao).

---

## 🏗️ Kiến trúc & Từng phần Xử lý (System Architecture)

Dự án được kết cấu qua 2 mảng chính: **Client-side (UI/State)** và **Server-side (API Proxy/Scraper)**. Dưới đây là luồng xử lý chi tiết của từng Modules:

### 1. Bản Đồ Giám Sát (Map Module)

- **Vị trí**: `src/components/map/VietnamMap.tsx`
- **Xử lý**:
  - Máy khách (Client) khởi tạo MapLibre gắn vào React. Sử dụng Tile Base bản đồ tông tối (`Dark_all` của CARTO).
  - Trải đè một lớp Polygon GeoJSON bao bọc 63 tỉnh thành Việt Nam (màu trắng dập opacity 0.15) để làm lu mờ phần còn lại của thế giới.
  - Theo dõi biến trạng thái từ Zustand. Khi người dùng bấm vào một Tỉnh trong khung Tìm kiếm hoặc Panel, sự kiện `map.fitBounds(turf.bbox(polygon))` sẽ được kích hoạt để thiết bị Camera nội suy và Zoom tự động xuống Vị trí đó.

### 2. Luồng Cảnh báo Thiên tai & Giám sát (Disaster & DMC)

Thay vì phải tự cào (scrape) các API vệ tinh thời tiết rời rạc phức tạp, dự án đã nhúng nguyên vẹn **Hệ thống giám sát thiên tai của Tổng cục Khí tượng Thủy văn (DMC)** vào bên trong Dashboard.

Tuy nhiên, trang gốc `vndms.dmc.gov.vn` có tính năng chống nhúng ở bên thứ ba. Dưới đây là cách chúng ta đã vượt qua rào cản đó bằng kỹ thuật **Proxy Header Stripping**:

- **Vị trí tệp xử lý Proxy**: `/api/dmc-proxy/route.ts`
- **Nguyên lý hoạt động chi tiết**:
  1. **Vấn đề "X-Frame-Options"**: Server của DMC trả về một cấu hình bảo mật là `X-Frame-Options: SAMEORIGIN` và `Content-Security-Policy`. Điều này nói với trình duyệt web của bạn rằng: _"Đừng cho phép trang web Việt Nam Monitor nhúng tôi vào iFrame"_. Nếu cố tình nhúng thẳng `<iframe src="https://vndms.dmc.gov.vn">`, trình duyệt sẽ chặn đứng và báo lỗi (Refused to display).
  2. **Giải pháp Đứng giữa (Middleman Proxy)**: Chúng ta lập ra một Route API Backend ngay trong Next.js. Frontend không gọi thẳng DMC nữa, mà gọi vào `/api/dmc-proxy`.
  3. **Backend gọi Backend**: Route API này sẽ dùng `fetch()` để lên trang DMC xin dữ liệu dưới tư cách một Fake Browser (giả mạo tham số `User-Agent` và `Referer`). Vì đây là một cuộc gọi từ Server-to-Server, cái luật `X-Frame-Options` của trình duyệt không tạo ra bất cứ rào cản gãy đổ nào ở bước này.
  4. **Cắt bỏ luật cấm (Header Stripping)**: Sau khi lấy được nội dung HTML của DMC, Route API sẽ sao chép toàn bộ các cấu hình mà DMC gửi về, nhưng **chủ động LỌC BỎ** 2 dòng cấm là `X-Frame-Options` và `Content-Security-Policy`.
  5. **Bơm thẻ `<base>` thần kỳ**: Có một vấn đề phát sinh. Trang HTML gốc của DMC dùng các đường dẫn tương đối (ví dụ: `<script src="/js/main.js"></script>`). Nếu ta mang HTML này về gắn vào Việt Nam Monitor, trình duyệt sẽ hiểu nhầm là phải tìm file đó ở `localhost:3000/js/main.js` (gây ra lỗi 404). Để khắc phục, Backend sẽ tiêm (inject) thẻ `<base href="https://vndms.dmc.gov.vn/">` vào đầu thẻ `<head>`. Thẻ này có tác dụng ép trình duyệt khi đọc HTML phải tự hiểu gốc đường dẫn là từ hệ thống DMC, giúp tải trọn vẹn mọi hình ảnh, CSS, JS của họ.
  6. **Hoàn thiện**: Cuối cùng API trả cái cục HTML đã "độ chế" này về lại cho Component Map trên UI (`src/app/page.tsx`). Lúc này Component chỉ việc nhúng `<iframe src="/api/dmc-proxy" />` là xong. Người dùng có thể ấn nút chuyển đổi (Toggle) giữa Map báo chí và Map thiên tai một cách mượt mà và trực tiếp quan sát trạm đo mưa Radar mà DMC cung cấp.

### 3. Luồng Theo Dõi Tài Chính & Crypto (Finance)

Được cô lập tại `/api/finance/...`. Việc đặt ở Server Route giúp lách lỗi CORS Error vì các bên VN không config CORS cho mọi domain:

- **Tỷ Giá Ngoại Tệ**: Cào từ tệp XML hệ thống của **Vietcombank** `pXML.aspx` -> Dịch XML ra JSON -> Lọc USD, EUR, JPY.
- **Giá Vàng**: Cào từ nhánh XML gốc của **SJC** `sjc.com.vn/xml/tygiavang.xml` -> Lọc các mốc Rồng Vàng, SJC 1L.
- **Tiền Mã Hóa (Crypto)**: GET dữ liệu từ **CoinGecko API** (`api.coingecko.com/api/v3/coins/markets`). Giới hạn top 100 coin có volume quy đổi lớn nhất VNĐ.
- **Chứng Khoán (Stocks)**: Hiển thị Mock Data (`VN-INDEX`, `HNX`, `UPCOM`) để cung cấp cái nhìn tổng quan về bảng giá do chưa có nguồn API WebSocket công khai miễn phí tại VN.

### 4. Luồng Tin Tức & Tóm tắt AI (News & Summarize)

- **Vị trí API**: `/api/rss/route.ts` & `/api/ai/...`
- **NewsPanel**: Cào nguồn báo RSS gốc của **VnExpress** (`vnexpress.net/rss/tin-moi-nhat.rss`). Dùng RegEx (Biểu thức chính quy) để cạo đi các Tag Description rác chứa src Ảnh bên trong CData của XML -> Cung cấp dữ liệu Sạch cho Frontend.
- **Tóm Tắt AI (Groq)**: Khi user bấm "Tóm tắt" ứng với một tin bài, Client gửi cụm văn bản cho `/api/ai/summarize`. Server Route dùng GroqSDK đẩy Text này cho cấu trúc Prompt của `llama3-8b-8192` và đợi mô hình trả về Bản tóm tắt tiếng Việt cực ngắn gọn.
- **Trending Keyword**: Gọi thẳng sang API LLM Llama3 để phân tích mảng bài báo mới và trả về cấu trúc mảng Top các "Từ khóa đang hot rần rần" để hiển thị trên phần _Panel Từ khóa Thịnh hành_ cho người xem nắm bắt sự kiện nhanh.

### 5. Băng Chuyền YouTube Mới Nhất (VTV24)

- **Vị trí**: `/api/youtube/route.ts` và component `YoutubeCarousel`.
- **Luồng xử lý**:
  - Né tránh việc sử dụng Google Data API (dễ hết Quota rate-limit), dự án đi thẳng trực tiếp vào nguồn RSS chìm của YouTube (`https://www.youtube.com/feeds/videos.xml?channel_id=UC...VTV24`).
  - Server Parse XML lấy ra ID, Ảnh đại diện, Tiêu đề, số Views bằng cách Parse thẻ `<media:group>`.
  - Trên màn UI Web, Component sử dụng Flex hộp ẩn thanh cuộn và cài đặt trạng thái `Pagination`.
  - Khởi tạo lần đầu hiển thị 12 Videos. Khi hàm `onScroll` lắng nghe người dùng kéo hộp (Carousel) kịch cỡ của mép màn hình phải, hàm sẽ Load thêm 4 videos (Lazy Loading).
  - Khi người dùng `onClick` một video, gọi một `<dialog>`/`<div> fixed z-100` phủ mờ toàn màn hình nhúng vào một React iFrame trỏ về Embedded Link YouTube để xem trực tiếp không cần Load lại trang.

---

## 🛠️ Hướng dẫn Khởi chạy (Dành cho Dev)

### 1. Cài đặt Package

Sử dụng phân hệ Node.js version 18 trở lên.

```bash
npm install
```

### 2. Thiết lập Biến môi trường

Tạo file `.env.local` ở thư mục Root và chèn API Key cho LLM Agent Groq (Bắt buộc dùng cho module AI Summarize / Trending).

```env
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxx"
```

### 3. Chạy môi trường Development

Kích hoạt máy ảo cục bộ Next.js. Quá trình hot-reload có thể mất vài giây lần dựng đầu tiên thông qua bộ Turbopack.

```bash
npm run dev
# Mở Tab mạng: http://localhost:3000
```

### 4. Build để Đưa lên Production

Sử dụng chuẩn Build của Next.js (Khuyến cáo tự động Build qua luồng CD của Vercel/Netlify dựa theo Cấu hình mặc định).

```bash
npm run build
npm start
```

---
