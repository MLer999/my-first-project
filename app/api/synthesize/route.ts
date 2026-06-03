import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { SYNTHESIS_PROMPT } from "@/lib/questions"

const CF_MODEL = "@cf/meta/llama-3.1-8b-instruct"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isGuest = req.headers.get("x-guest") === "1"
  if (!user && !isGuest) return new NextResponse("Unauthorized", { status: 401 })

  const { answers } = await req.json()
  const userContent = (answers as string[])
    .map((a, i) => `Answer ${i + 1}: ${a || "(empty)"}`)
    .join("\n\n")

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYNTHESIS_PROMPT },
          { role: "user", content: userContent },
        ],
        stream: true,
        max_tokens: 1024,
      }),
    }
  )

  console.log("[CF] status:", cfRes.status, "ok:", cfRes.ok)
  console.log("[CF] content-type:", cfRes.headers.get("content-type"))

  if (!cfRes.ok) {
    const errText = await cfRes.text()
    console.error("[CF] error body:", errText)
    return new NextResponse(errText, { status: cfRes.status })
  }

  return new NextResponse(cfRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  })
}
