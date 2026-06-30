import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediMate AI - Trợ lý Nhắc lịch & Kiểm tra Tương tác Thuốc thông minh",
  description: "Trợ lý sức khỏe ứng dụng trí tuệ nhân tạo (AI) giúp nhắc lịch uống thuốc, theo dõi tiến độ tuân thủ và tự động kiểm tra tương tác thuốc an toàn y khoa qua dữ liệu openFDA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
