"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { QUESTIONS } from "@/lib/questions"
import type { User } from "@supabase/supabase-js"

type Message = { role: "assistant" | "user"; content: string }
type Step = "loading" | "existing" | "chat" | "synthesizing" | "done"

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
      console.log("[DEBUG] body length:", body.length)
      console.log("[DEBUG] content to save:", content.slice(0, 100))
      const saveRes = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, content }),
      })
      const saveData = await saveRes.json()
      console.log("[DEBUG] save status:", saveRes.status, saveData)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-semibold text-white text-sm">🌙 振り返りアプリ</span>
        <div className="flex items-center gap-3">
          {!isGuest && (
            <button
              onClick={() => router.push("/history")}
              className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              📚 履歴
            </button>
          )}
          {isGuest ? (
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
              ゲスト
            </span>
          ) : (
            <span className="text-xs text-slate-500 hidden sm:block truncate max-w-[160px]">{user?.email}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isGuest ? "終了" : "ログアウト"}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col p-4 gap-4">

        {step === "existing" && (
          <div className="space-y-4 mt-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
              今日（{dateStr}）の振り返りはすでに保存されています。
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
              <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">{existingContent}</pre>
            </div>
            <button
              onClick={startReflection}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg transition-all"
            >
              ✏️ 上書きする
            </button>
          </div>
        )}

        {step === "chat" && (
          <>
            <div className="flex-1 space-y-4 pt-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                      🌙
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-slate-800/60 border border-white/5 text-slate-200"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 pb-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="答えを入力..."
                className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl text-sm font-semibold disabled:opacity-30 transition-all shadow-lg shadow-indigo-500/20"
              >
                送信
              </button>
            </form>
          </>
        )}

        {(step === "synthesizing" || step === "done") && (
          <div className="space-y-4 pt-4">
            {step === "synthesizing" && (
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                振り返りをまとめています...
              </div>
            )}
            {step === "done" && (
              <div className={`rounded-xl px-4 py-3 text-sm border ${
                isGuest
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}>
                {isGuest
                  ? "⚠️ ゲストモードのため保存されません。ブラウザを閉じると消えます。"
                  : "✅ 保存しました"}
              </div>
            )}
            {synthesis && (
              <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
                <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans leading-relaxed">{synthesis}</pre>
              </div>
            )}
            {step === "done" && (
              <button
                onClick={startReflection}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-sm rounded-lg transition-all"
              >
                もう一度始める
              </button>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
