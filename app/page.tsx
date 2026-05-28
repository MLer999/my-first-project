"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    await createClient().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  function handleGuest() {
    sessionStorage.setItem("reflection-guest", "1")
    router.push("/reflect")
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6 text-3xl">
            🌙
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            振り返りアプリ
          </h1>
          <p className="mt-3 text-slate-400 text-lg">
            AIと一緒に、今日の気づきを記録しよう
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* GitHub login card */}
          <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur border border-white/10 rounded-2xl p-7 flex flex-col ring-1 ring-indigo-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-base">
                💾
              </div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">記録を残す</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">GitHubでログイン</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              振り返りが蓄積されていきます。<br />GitHubアカウントで即ログイン。
            </p>

            <ul className="space-y-2 mb-8">
              {["ワンクリックでログイン", "振り返りの履歴を保存", "いつでも読み返せる"].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-400">
                  <span className="text-indigo-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={handleGitHub}
              disabled={loading}
              className="mt-auto w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              {loading ? "リダイレクト中..." : "GitHubでログイン →"}
            </button>
          </div>

          {/* Guest card */}
          <div className="bg-slate-900/40 backdrop-blur border border-white/[0.06] rounded-2xl p-7 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center text-base">
                👤
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">記録なし</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">ゲストで試す</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              登録不要でAIとの振り返りを体験。ブラウザを閉じるとデータは消えます。
            </p>

            <ul className="space-y-2 mb-8">
              {[
                { ok: true,  text: "登録・ログイン不要" },
                { ok: true,  text: "AIの振り返り生成を体験" },
                { ok: false, text: "履歴の保存なし" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span className={item.ok ? "text-slate-400" : "text-slate-600"}>{item.ok ? "✓" : "✕"}</span>
                  <span className={item.ok ? "text-slate-400" : "text-slate-600"}>{item.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleGuest}
              className="mt-auto w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all"
            >
              ゲストとして始める →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}
