import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sub.hieunt-vogue.online'), // Cập nhật lại domain thực tế nếu có
  title: {
    default: "Vietnam Monitor | Dashboard Tin Tức & Dữ Liệu Tổng Hợp 24h",
    template: "%s | Vietnam Monitor"
  },
  description: "Dõi theo mạch đập Việt Nam: Tổng hợp tin tức nóng nhất, dữ liệu kinh tế (chứng khoán, vàng, ngoại tệ), thời tiết và cảnh báo thiên tai tức thì trong một Dashboard.",
  keywords: ["tin tức", "kinh tế việt nam", "thời tiết", "cảnh báo thiên tai", "dashboard tin tức", "bản đồ việt nam", "giá vàng", "tỷ giá", "vtv24"],
  authors: [{ name: "Hiếu Nguyễn", url: "https://hieunt-vogue.online/" }],
  creator: "Hiếu Nguyễn",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://sub.hieunt-vogue.online",
    title: "Vietnam Monitor | Dashboard Tin Tức & Dữ Liệu Tổng Hợp",
    description: "Giám sát tin tức, sự kiện, thời tiết và dữ liệu kinh tế Việt Nam theo thời gian thực. Nắm bắt xu hướng nhanh nhất.",
    siteName: "Vietnam Monitor"
  },
  twitter: {
    card: "summary_large_image",
    title: "Vietnam Monitor | Dashboard Tin Tức",
    description: "Giám sát tin tức nóng, sự kiện, thời tiết và dữ liệu kinh tế vi mô/vĩ mô Việt Nam theo thời gian thực.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  icons: {
    icon: [
      { url: '/favicon.png?v=5', type: 'image/png' },
      { url: '/icon.png?v=5', type: 'image/png' }
    ],
    shortcut: ['/favicon.png?v=5'],
    apple: [
      { url: '/apple-icon.png?v=5', sizes: '180x180', type: 'image/png' },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-muted/30 antialiased flex flex-col items-center`}>
        <div className="w-full max-w-[1536px] bg-background flex flex-col flex-1 shadow-2xl relative border-x border-border/50 overflow-x-hidden">
          <Header />
          <main className="flex-1 flex flex-col relative">
            {children}
          </main>
          {/* Footer Giải trí */}
          <footer className="w-full border-t border-border/50 bg-muted/20 py-6 px-4 shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                ĐÂY CHỈ LÀ SẢN PHẨM VỚI MỤC ĐÍCH GIẢI TRÍ
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Dữ liệu được tổng hợp tự động từ các nguồn tin tức công khai trên Internet.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
