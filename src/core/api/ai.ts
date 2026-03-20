// ai.ts
type AIModel = 'fast' | 'smart'

type AIResponse = {
  content: string
}

// 修正: 現在提供されている 2.5 シリーズのモデルに変更
const MODEL_MAP: Record<AIModel, string> = {
  fast: 'gemini-2.5-flash',
  smart: 'gemini-2.5-pro',
}

export const AI_API = {
  async ask(
    prompt: string,
    options: {
      model?: AIModel
      context?: string
      systemPrompt?: string
    } = {}
  ): Promise<AIResponse> {
    const {
      model = 'fast',
      context,
      systemPrompt = 'あなたは学習をサポートするAIアシスタントです。',
    } = options

    const userContent = context
      ? `## 参照コンテキスト\n${context}\n\n## 質問\n${prompt}`
      : prompt

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_MAP[model], // ここで正しく 'gemini-2.5-...' が渡されます
        systemPrompt,
        message: userContent,
      }),
    })

    const data = await response.json()

    console.log('status:', response.status)
    console.log('response data:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error('AI APIのリクエストに失敗しました')
    }

    return { content: data.content }
  },
}