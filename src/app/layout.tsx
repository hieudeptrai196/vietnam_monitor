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
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
