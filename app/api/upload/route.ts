import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'メディアはブラウザから直接アップロードしてください' },
    { status: 405 }
  )
}
