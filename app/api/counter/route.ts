import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

const COUNTER_KEY = "visitor_count_shimotsuki"

export async function POST() {
  try {
    const redis = Redis.fromEnv()
    const count = await redis.incr(COUNTER_KEY)
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: null })
  }
}
