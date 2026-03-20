// route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // リクエストから model を受け取る
    const { systemPrompt, message, model } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 })
    }

    // 修正: デフォルトのフォールバックを現在の最新モデルに変更
    const targetModel = model || 'gemini-2.5-flash'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents:[
            { role: 'user', parts: [{ text: message }] }
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    const content = data.candidates[0].content.parts[0].text
    return NextResponse.json({ content })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}