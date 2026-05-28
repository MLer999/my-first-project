"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type Reflection = { id: string; date: string; created_at: string }

export default function HistoryPage() {
  const router = useRouter()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [selected, setSelected] = useState<Reflection | null>(null)
  const [content, setContent] = useState("")
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem("reflection-guest") === "1") {
      router.push("/reflect")
      return
    }
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/")
    })
  }, [router])

  const fetchList = useCallback((kw?: string) => {
    setLoading(true)
    const url = kw ? `/api/reflections?keyword=${encodeURIComponent(kw)}` : "/api/reflections"
    fetch(url)
      .then((r) => r.json())
      .then((data) => setReflections(data.reflections ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  useEffect(() => {
    const timer = setTimeout(() => fetchList(keyword || undefined), 400)
    return () => clearTimeout(timer)
  }, [keyword, fetchList])

  async function selectReflection(r: Reflection) {
    setSelected(r)
    setContent("")
    setContentLoading(true)
    const res = await fetch(`/api/reflections?date=${r.date}`)
    const data = await res.json()
    setContent(data.content ?? "")
    setContentLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-semibold text-white text-sm">📚 振り返り履歴</span>
        <button
          onClick={() => router.push("/reflect")}
          className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          ← 今日の振り返り
        </button>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full p-4 flex gap-4">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 space-y-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="キーワード検索..."
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs py-2 px-1">
              <div className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
              読み込み中...
            </div>
          ) : reflections.length === 0 ? (
            <div className="text-xs text-slate-600 py-2 px-1">
              {keyword ? "見つかりません" : "まだ振り返りがありません"}
            </div>
          ) : (
            <div className="space-y-1">
              {reflections.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectReflection(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    selected?.id === r.id
                      ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {r.date}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Content */}
        <main className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl p-6 min-h-[500px]">
          {contentLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              読み込み中...
            </div>
          ) : content ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">{content}</pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-3 opacity-30">📖</div>
              <p className="text-slate-600 text-sm">左から振り返りを選択してください</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
