type AIModel = 'fast' | 'smart'

type AIResponse = {
  content: string
}

const MODEL_MAP: Record<AIModel, string> = {
  fast: 'gemini-2.0-flash',
  smart: 'gemini-2.0-flash',
}

export const AI_API = {

  async ask(
    prompt: string,
    options: {
      model?: AIModel
      context?: string  // ノートの内容など
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
        model: MODEL_MAP[model],
        systemPrompt,
        message: userContent,
      }),
    })

    if (!response.ok) throw new Error('AI APIのリクエストに失敗しました')

    const data = await response.json()
    return { content: data.content }
  },
}