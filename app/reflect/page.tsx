"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { QUESTIONS } from "@/lib/questions"
import type { User } from "@supabase/supabase-js"

type Message = { role: "assistant" | "user"; content: string }
type Step = "loading" | "existing" | "chat" | "synthesizing" | "done"

const RS = { fontFamily: '"MS Pゴシック", "MS PGothic", sans-serif', color: "#000080" }

export default function ReflectPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [step, setStep] = useState<Step>("loading")
  const [qIndex, setQIndex] = useState(0)
  const [input, setInput] = useState("")
  const [synthesis, setSynthesis] = useState("")
  const [existingContent, setExistingContent] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const dateStr = new Date().toLocaleDateString("sv-SE")

  useEffect(() => {
    const guest = sessionStorage.getItem("reflection-guest") === "1"
    if (guest) {
      setIsGuest(true)
      startReflection()
      return
    }
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return }
      setUser(user)
      fetch(`/api/reflections?date=${dateStr}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.content) { setExistingContent(data.content); setStep("existing") }
          else startReflection()
        })
        .catch(() => startReflection())
    })
  }, []) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, synthesis])

  function startReflection() {
    setMessages([{
      role: "assistant",
      content: `こんにちは！今日（${new Date().toLocaleDateString("sv-SE")}）の振り返りを始めましょう。\n\n${QUESTIONS[0]}`
    }])
    setAnswers([])
    setQIndex(0)
    setSynthesis("")
    setStep("chat")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || step !== "chat") return
    const text = input.trim()
    setInput("")
    const newAnswers = [...answers, text]
    const newMessages: Message[] = [...messages, { role: "user", content: text }]

    if (qIndex < QUESTIONS.length - 1) {
      newMessages.push({ role: "assistant", content: QUESTIONS[qIndex + 1] })
      setMessages(newMessages)
      setAnswers(newAnswers)
      setQIndex(qIndex + 1)
    } else {
      setMessages(newMessages)
      setAnswers(newAnswers)
      setStep("synthesizing")
      await runSynthesis(newAnswers)
    }
  }

  async function runSynthesis(finalAnswers: string[]) {
    const res = await fetch("/api/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(isGuest ? { "x-guest": "1" } : {}),
      },
      body: JSON.stringify({ answers: finalAnswers }),
    })
    if (!res.body) return

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let body = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6).trim()
        if (data === "[DONE]") break
        try {
          const parsed = JSON.parse(data)
          if (parsed.response) { body += parsed.response; setSynthesis(body) }
        } catch { /* partial chunk */ }
      }
    }

    if (!isGuest) {
      const now = new Date().toLocaleString("ja-JP")
      const content = `# 振り返り — ${dateStr}\n\n${body.trim()}\n\n---\n記録日時: ${now}\n`
      await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, content }),
      })
    }
    setStep("done")
  }

  async function handleSignOut() {
    if (isGuest) {
      sessionStorage.removeItem("reflection-guest")
      router.push("/")
      return
    }
    await createClient().auth.signOut()
    router.push("/")
  }

  if (step === "loading") {
    return (
      <div style={{ background: "#E0FFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", ...RS }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ background: "#E0FFFF", minHeight: "100vh", padding: "20px 0", ...RS }}>
      <div className="retro-wrapper" style={{ display: "flex", flexDirection: "column" }}>
        <header style={{ borderBottom: "2px dashed #000080", marginBottom: "16px", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: "bold", fontSize: "15px" }}>🌙 振り返りアプリ</span>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12px" }}>
            {!isGuest && (
              <button onClick={() => router.push("/history")} className="retro-btn" style={{ padding: "3px 10px", fontSize: "12px" }}>
                📚 履歴
              </button>
            )}
            {isGuest ? (
              <span style={{ border: "1px solid #000080", padding: "2px 6px" }}>ゲスト</span>
            ) : (
              <span>{user?.email}</span>
            )}
            <button
              onClick={handleSignOut}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#000080", fontSize: "12px", textDecoration: "underline", fontFamily: '"MS Pゴシック", "MS PGothic", sans-serif' }}
            >
              {isGuest ? "終了" : "ログアウト"}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {step === "existing" && (
            <div>
              <p style={{ border: "1px solid #000080", padding: "8px", background: "#fffff0", margin: "0 0 12px" }}>
                ⚠ 今日（{dateStr}）の振り返りはすでに保存されています。
              </p>
              <div className="retro-box">
                <pre style={{ whiteSpace: "pre-wrap", fontSize: "13px", margin: 0, ...RS }}>{existingContent}</pre>
              </div>
              <button onClick={startReflection} className="retro-btn">✏ 上書きする</button>
            </div>
          )}

          {step === "chat" && (
            <>
              <div style={{ flex: 1 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    {msg.role === "assistant" ? (
                      <div style={{ borderLeft: "3px solid #000080", paddingLeft: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "3px" }}>【AI】</div>
                        <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "14px", ...RS }}>{msg.content}</pre>
                      </div>
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ background: "#000080", color: "#ffffff", padding: "5px 12px", fontSize: "14px", display: "inline-block" }}>
                          &gt; {msg.content}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", borderTop: "1px dashed #000080", paddingTop: "12px" }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="答えを入力してください..."
                  autoFocus
                  style={{ flex: 1, border: "2px solid #000080", padding: "6px 8px", ...RS, fontSize: "14px" }}
                />
                <button type="submit" disabled={!input.trim()} className="retro-btn">
                  送信 ▶
                </button>
              </form>
            </>
          )}

          {(step === "synthesizing" || step === "done") && (
            <div>
              {step === "synthesizing" && (
                <p style={{ margin: "0 0 12px" }}>⏳ 振り返りをまとめています... しばらくお待ちください。</p>
              )}
              {step === "done" && (
                <p style={{ border: "1px solid #000080", padding: "8px", background: isGuest ? "#fffff0" : "#f0fff0", margin: "0 0 12px" }}>
                  {isGuest ? "⚠ ゲストモードのため保存されません。" : "✅ 保存しました"}
                </p>
              )}
              {synthesis && (
                <div className="retro-box">
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "13px", margin: 0, ...RS }}>{synthesis}</pre>
                </div>
              )}
              {step === "done" && (
                <button onClick={startReflection} className="retro-btn">↩ もう一度始める</button>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <footer style={{ borderTop: "1px dashed #000080", paddingTop: "10px", textAlign: "center", fontSize: "12px", marginTop: "20px" }}>
          振り返りアプリ &copy; 2026
        </footer>
      </div>
    </div>
  )
}
