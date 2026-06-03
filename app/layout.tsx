import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "振り返りアプリ",
  description: "毎日の振り返りを記録しよう",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: '"MS Pゴシック", "MS PGothic", sans-serif', backgroundColor: "#E0FFFF", color: "#000080", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
