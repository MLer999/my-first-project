import { createClient } from "redis"
import { NextResponse } from "next/server"

const COUNTER_KEY = "visitor_count_shimotsuki"

export async function POST() {
  const url = process.env.REDIS_URL
  if (!url) return NextResponse.json({ count: null })

  try {
    const client = createClient({ url })
    await client.connect()
    const count = await client.incr(COUNTER_KEY)
    await client.disconnect()
    return NextResponse.json({ count })
  } catch (e) {
    console.error("[COUNTER]", e)
    return NextResponse.json({ count: null })
  }
}
