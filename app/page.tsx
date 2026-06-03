"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const RS = { fontFamily: '"MS Pゴシック", "MS PGothic", sans-serif', color: "#000080" }

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem("reflection-guest") === "1") {
      router.push("/reflect")
      return
    }
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/reflect")
      else setChecking(false)
    })
  }, [router])

  async function handleGitHub() {
    setLoadingProvider("github")
    await createClient().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  async function handleGoogle() {
    setLoadingProvider("google")
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  function handleGuest() {
    sessionStorage.setItem("reflection-guest", "1")
    router.push("/reflect")
  }

  if (checking) {
    return (
      <div style={{ background: "#E0FFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", ...RS }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ background: "#E0FFFF", minHeight: "100vh", padding: "20px 0", ...RS }}>
      <div className="retro-wrapper">
        <header style={{ textAlign: "center", borderBottom: "2px dashed #000080", marginBottom: "20px", padding: "15px" }}>
          <h1 style={{ color: "#000080", fontSize: "26px", margin: "0 0 8px" }}>
            ★☆ 振り返りアプリへようこそ！ ☆★
          </h1>
          <p style={{ margin: 0, fontSize: "14px" }}>AIと一緒に、今日の気づきを記録しよう</p>
        </header>

        <div className="retro-marquee-box">
          <span className="retro-marquee-content">
            ✨ 今日も一日お疲れ様でした～♪ &nbsp;&nbsp;&nbsp; AIと振り返りをはじめましょう！ &nbsp;&nbsp;&nbsp; 記録は財産です☆ &nbsp;&nbsp;&nbsp; ✨ 今日も一日お疲れ様でした～♪ &nbsp;&nbsp;&nbsp; AIと振り返りをはじめましょう！ &nbsp;&nbsp;&nbsp; 記録は財産です☆
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div className="retro-box">
            <h2 style={{ color: "#000080", borderBottom: "2px solid #000080", paddingBottom: "5px", marginTop: 0, fontSize: "16px" }}>
              💾 GitHubでログイン
            </h2>
            <p style={{ fontSize: "13px", margin: "0 0 8px" }}>振り返りが蓄積されていきます。GitHubアカウントで即ログイン。</p>
            <ul style={{ fontSize: "13px", paddingLeft: "18px", margin: "0 0 12px" }}>
              <li>ワンクリックでログイン</li>
              <li>振り返りの履歴を保存</li>
              <li>いつでも読み返せる</li>
            </ul>
            <button
              onClick={handleGitHub}
              disabled={loadingProvider !== null}
              className="retro-btn"
              style={{ width: "100%" }}
            >
              {loadingProvider === "github" ? "リダイレクト中..." : "► GitHubでログイン"}
            </button>
          </div>

          <div className="retro-box">
            <h2 style={{ color: "#000080", borderBottom: "2px solid #000080", paddingBottom: "5px", marginTop: 0, fontSize: "16px" }}>
              🔍 Googleでログイン
            </h2>
            <p style={{ fontSize: "13px", margin: "0 0 8px" }}>振り返りが蓄積されていきます。Googleアカウントで即ログイン。</p>
            <ul style={{ fontSize: "13px", paddingLeft: "18px", margin: "0 0 12px" }}>
              <li>ワンクリックでログイン</li>
              <li>振り返りの履歴を保存</li>
              <li>いつでも読み返せる</li>
            </ul>
            <button
              onClick={handleGoogle}
              disabled={loadingProvider !== null}
              className="retro-btn"
              style={{ width: "100%" }}
            >
              {loadingProvider === "google" ? "リダイレクト中..." : "► Googleでログイン"}
            </button>
          </div>
        </div>

        <div className="retro-box" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13px" }}>
            👤 <strong>ゲストで試す</strong> — 登録不要でAIとの振り返りを体験。ブラウザを閉じるとデータは消えます。
          </p>
          <button
            onClick={handleGuest}
            className="retro-btn"
            style={{ background: "#ffffff", color: "#000080" }}
          >
            ► ゲストとして始める
          </button>
        </div>

        <footer style={{ borderTop: "1px dashed #000080", padding: "15px 0", textAlign: "center", fontSize: "12px", marginTop: "20px" }}>
          振り返りアプリ &copy; 2026 &nbsp;|&nbsp; 訪問者数: <span className="retro-counter">000042</span>
        </footer>
      </div>
    </div>
  )
}
