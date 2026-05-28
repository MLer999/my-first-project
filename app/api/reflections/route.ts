import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const date = searchParams.get("date")
  const keyword = searchParams.get("keyword")

  if (date) {
    const { data } = await supabase
      .from("reflections")
      .select("content")
      .eq("user_id", user.id)
      .eq("date", date)
      .single()
    return NextResponse.json({ content: data?.content ?? null })
  }

  let query = supabase
    .from("reflections")
    .select("id, date, created_at")
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  if (keyword) {
    query = query.ilike("content", `%${keyword}%`)
  }

  const { data } = await query
  return NextResponse.json({ reflections: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { date, content } = await req.json()
  const { error } = await supabase
    .from("reflections")
    .upsert({ user_id: user.id, date, content }, { onConflict: "user_id,date" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
