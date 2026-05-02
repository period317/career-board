import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "다이몬 커리어 — 기획·마케팅·PM 채용공고 큐레이션",
  description: "기획자, PM, 마케터를 위한 큐레이션된 채용공고. 사람인·워크넷에서 자동 수집된 공고를 멘토 추천 메모와 함께 제공합니다. 다이몬 커리어 컨설팅이 운영합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F7F7F5]">
        <header className="border-b border-[#E5E5E3] bg-white">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight">다이몬 커리어</span>
              <span className="text-[11px] text-[#ABABAB]">기획·마케팅·PM 공고</span>
            </Link>
            <nav className="text-[13px] text-[#6B6B6B] flex gap-4">
              <Link href="/" className="hover:text-black">전체</Link>
              <Link href="/?cat=planning" className="hover:text-black">기획</Link>
              <Link href="/?cat=pm-po" className="hover:text-black">PM</Link>
              <Link href="/?cat=marketing" className="hover:text-black">마케팅</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#E5E5E3] bg-white mt-16">
          <div className="max-w-5xl mx-auto px-5 py-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[13px] font-bold text-[#111111]">다이몬 커리어 컨설팅</p>
              <p className="text-[11px] text-[#ABABAB] mt-0.5">기획·마케팅·PM 공고 큐레이션</p>
            </div>
            <p className="text-[11px] text-[#ABABAB]">
              공고 출처: 사람인 · 워크넷 · 직접 등록
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
