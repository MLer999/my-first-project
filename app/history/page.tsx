"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type Reflection = { id: string; date: string; created_at: string }

const RS = { fontFamily: '"MS Pゴシック", "MS PGothic", sans-serif', color: "#000080" }

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
    <div style={{ background: "#E0FFFF", minHeight: "100vh", padding: "20px 0", ...RS }}>
      <div className="retro-wrapper">
        <header style={{ borderBottom: "2px dashed #000080", marginBottom: "16px", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: "bold", fontSize: "15px" }}>📚 振り返り履歴</span>
          <button onClick={() => router.push("/reflect")} className="retro-btn" style={{ padding: "3px 10px", fontSize: "12px" }}>
            ← 今日の振り返り
          </button>
        </header>

        <div style={{ display: "flex", gap: "0" }}>
          <nav style={{ width: "155px", flexShrink: 0, borderRight: "1px dashed #000080", paddingRight: "12px", marginRight: "12px" }}>
            <strong style={{ display: "block", borderBottom: "1px solid #000080", marginBottom: "8px", fontSize: "13px" }}>
              🗓 一覧
            </strong>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワード検索"
              style={{ width: "100%", border: "1px solid #000080", padding: "3px 5px", fontSize: "12px", ...RS, boxSizing: "border-box" as const, marginBottom: "8px" }}
            />
            {loading ? (
              <p style={{ fontSize: "12px", margin: 0 }}>読み込み中...</p>
            ) : reflections.length === 0 ? (
              <p style={{ fontSize: "12px", margin: 0 }}>{keyword ? "見つかりません" : "まだ振り返りがありません"}</p>
            ) : (
              <div>
                {reflections.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectReflection(r)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: selected?.id === r.id ? "#000080" : "none",
                      color: selected?.id === r.id ? "#ffffff" : "#000080",
                      border: "none",
                      padding: "4px 6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: '"MS Pゴシック", "MS PGothic", sans-serif',
                      marginBottom: "2px",
                    }}
                  >
                    {r.date}
                  </button>
                ))}
              </div>
            )}
          </nav>

          <main style={{ flex: 1, border: "2px dashed #000080", padding: "16px", minHeight: "400px" }}>
            {contentLoading ? (
              <p style={{ fontSize: "13px", margin: 0 }}>読み込み中...</p>
            ) : content ? (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "13px", margin: 0, ...RS }}>{content}</pre>
            ) : (
              <p style={{ fontSize: "13px", color: "#888888", margin: 0 }}>← 左から振り返りを選択してください</p>
            )}
          </main>
        </div>

        <footer style={{ borderTop: "1px dashed #000080", paddingTop: "10px", textAlign: "center", fontSize: "12px", marginTop: "20px" }}>
          振り返りアプリ &copy; 2026
        </footer>
      </div>
    </div>
  )
}
