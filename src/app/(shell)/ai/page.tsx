'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import RightPanel from '@/features/editor/RightPanel'
import { StorageAPI } from '@/core/api/storage'
import type { Note } from '@/core/types/note'
import { canvasToPlainText, parseCanvasContent, CANVAS_SIGNATURE } from '@/features/editor/canvas/canvas-utils'

export default function AiPage() {
  const searchParams = useSearchParams()
  const prompt = searchParams.get('q') ?? ''
  const context = searchParams.get('context') ?? ''
  const [summary, setSummary] = useState('')
  const [summaryLabel, setSummaryLabel] = useState('ノート履歴を読み込み中...')
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const buildSummary = (notes: Note[]) => {
    const extractText = (content: string) => {
      if (content?.startsWith(CANVAS_SIGNATURE)) {
        return canvasToPlainText(parseCanvasContent(content))
      }
      return content ?? ''
    }

    const strip = (text: string) =>
      text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/[#>*_\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const lines = notes.slice(0, 20).map(n => {
      const snippet = strip(extractText(n.content_markdown || '')).slice(0, 120)
      const date = new Date(n.updated_at).toLocaleDateString()
      return `- ${n.title || '無題'} (${date}): ${snippet || '（本文なし）'}`
    })

    const header = `ノート数: ${notes.length}`
    const body = lines.length > 0 ? `最近のノート:\n${lines.join('\n')}` : '最近のノートはありません'
    return `${header}\n${body}`
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingSummary(true)
      setSummaryError(null)
      try {
        const notes = await StorageAPI.notes.getAllForUser()
        if (!active) return
        const text = buildSummary(notes)
        setSummary(text)
        setSummaryLabel(`ノート履歴サマリー（${notes.length}件）`)
      } catch (e) {
        if (!active) return
        setSummary('')
        setSummaryError('ノート履歴の取得に失敗しました')
        setSummaryLabel('ノート履歴の取得に失敗しました')
      } finally {
        if (active) setLoadingSummary(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <RightPanel
      mode="ai"
      scope="global"
      initialQuery={prompt || context}
      initialPrompt={loadingSummary ? undefined : (prompt || undefined)}
      hasContext={summary.length > 0}
      contextText={summary || undefined}
      contextLabel={summaryLabel}
      disabled={loadingSummary}
      disabledReason={summaryError ?? 'ノート履歴を読み込み中...'}
      layout="full"
      showClose={false}
      systemPrompt="あなたは学習全体を支援するAIです。ノート横断の視点で、学習計画や次に学ぶべきテーマを提案してください。不明な点は質問してから提案してください。"
    />
  )
}
