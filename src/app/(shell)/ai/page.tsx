'use client'

import { useSearchParams } from 'next/navigation'
import RightPanel from '@/features/editor/RightPanel'

export default function AiPage() {
  const searchParams = useSearchParams()
  const prompt = searchParams.get('q') ?? ''
  const context = searchParams.get('context') ?? ''

  return (
    <RightPanel
      mode="ai"
      initialQuery={prompt || context}
      initialPrompt={prompt || undefined}
      hasContext={context.length > 0}
      contextText={context || undefined}
      layout="full"
      showClose={false}
    />
  )
}
