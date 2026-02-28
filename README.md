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

### 2. Luồng Cảnh báo Thiên tai & Động đất (Disaster & Quake)

- **Vị trí API**: `/api/disasters/route.ts` & `/api/earthquakes/route.ts`
- **Cách xử lý Động Đất**:
  - GET tới API của **USGS** (`earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson`).
  - Server dùng bounding box (Hộp giới hạn tọa độ Việt Nam/Đông Dương) để lọc vứt bỏ các trận động đất ngoài tầm kiểm soát. Sau đó trả JSON về Frontend để vẽ Icon Marker Cảnh báo (Trắng/Đỏ tùy độ Richter).
- **Cách xử lý Thiên tai (Bão/Lũ)**:
  - Gọi tới nguồn cấp XML RSS của **GDACS** của Liên Hợp Quốc (`www.gdacs.org/xml/rss.xml`).
  - Dùng `fast-xml-parser` bóc tách thẻ HTML bên trong Node XML. Đối chiếu kinh/vĩ tuyến (bbox Vietnam) -> Trả về JSON mảng thiên tai theo từng Alert Level (Cam/Đỏ) vẽ lên bản đồ.

### 3. Luồng Theo Dõi Tài Chính & Crypto (Finance)

Được cô lập tại `/api/finance/...`. Việc đặt ở Server Route giúp lách lỗi CORS Error vì các bên VN không config CORS cho mọi domain:

- **Tỷ Giá Ngoại Tệ**: Cào từ tệp XML hệ thống của **Vietcombank** `pXML.aspx` -> Dịch XML ra JSON -> Lọc USD, EUR, JPY.
- **Giá Vàng**: Cào từ nhánh XML gốc của **SJC** `sjc.com.vn/xml/tygiavang.xml` -> Lọc các mốc Rồng Vàng, SJC 1L.
- **Tiền Mã Hóa (Crypto)**: GET dữ liệu từ **CoinGecko API** (`api.coingecko.com/api/v3/coins/markets`). Giới hạn top 100 coin có volume quy đổi lớn nhất VNĐ.
- **Chứng Khoán (Stocks)**: Hiện tại trả về Mock Data (`VN-INDEX`, `HNX`, `UPCOM`) do chưa có nguồn cấp Web Socket miễn phí tại VN. Sẽ cần ghép nối SSI/Fireant SDK ở Phase tương lai.

### 4. Luồng Tin Tức & Tóm tắt AI (News & Summarize)

- **Vị trí API**: `/api/rss/route.ts` & `/api/ai/...`
- **NewsPanel**: Cào nguồn báo RSS gốc của **VnExpress** (`vnexpress.net/rss/tin-moi-nhat.rss`). Dùng RegEx (Biểu thức chính quy) để cạo đi các Tag Description rác chứa src Ảnh bên trong CData của XML -> Cung cấp dữ liệu Sạch cho Frontend.
- **Tóm Tắt AI (Groq)**: Khi user bấm "Tóm tắt" ứng với một tin bài, Client gửi cụm văn bản cho `/api/ai/summarize`. Server Route dùng GroqSDK đẩy Text này cho cấu trúc Prompt của `llama3-8b-8192` và đợi mô hình trả về Bản tóm tắt tiếng Việt cực ngắn gọn.
- **Trending Keyword**: Worker `/api/ai/trending` fetch 4 nguồn RSS VnExpress cùng một lúc, trộn Text lại và truyền cho LLM Llama3 bóc tách Top 5 "Từ khóa đang hot trong ngày" hiển thị trên thanh tìm kiếm của bản đồ.

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
