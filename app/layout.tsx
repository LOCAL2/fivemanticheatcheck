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
  title: "FiveM Anti-Cheat Check",
  description: "ตรวจสอบระบบ Anti-Cheat ของเซิร์ฟเวอร์ FiveM ในประเทศไทย พร้อมข้อมูลผู้เล่น แผนที่ และรายละเอียดเซิร์ฟเวอร์แบบเรียลไทม์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
