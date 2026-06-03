import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

const COUNTER_KEY = "visitor_count_shimotsuki"

export async function POST() {
  try {
    const redis = Redis.fromEnv()
    const count = await redis.incr(COUNTER_KEY)
    return NextResponse.json({ count })
  } catch (e) {
    console.error("[COUNTER] error:", e)
    return NextResponse.json({ count: null, error: String(e) })
  }
}

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "未設定"
  return NextResponse.json({ url_set: url !== "未設定", env_check: url.slice(0, 30) })
}
