'use client'

import { useState, useEffect } from 'react'
import { AI_API } from '@/core/api/ai'

type Mode = 'search' | 'ai'

type Props = {
  mode: Mode
  initialQuery: string
  hasContext: boolean
  onClose: () => void
}

export default function RightPanel({ mode, initialQuery, hasContext, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAI = async (promptOverride?: string) => {
    const prompt = promptOverride ?? aiPrompt
    if (!prompt.trim()) return
    setLoading(true)
    setAiResult('')

    const res = hasContext
      ? await AI_API.ask(prompt, { context: query })
      : await AI_API.ask(prompt)

    setAiResult(res.content)
    setLoading(false)
  }

  // トップバーからの場合（hasContext: false）は即送信
  useEffect(() => {
    if (mode === 'ai' && !hasContext) {
      handleAI(query)
    }
  }, [])

  return (
    <div className="w-80 border-l flex flex-col bg-white">

      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
          {mode === 'search' ? '検索' : 'AI'}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* クエリ表示 */}
      <div className="px-3 py-2 border-b">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-black"
          placeholder="検索ワードを入力..."
        />
      </div>

      {/* 検索モード */}
      {mode === 'search' && (
        <div className="flex-1 flex flex-col p-3 gap-3">
          <p className="text-xs text-gray-500">
            セキュリティ上の理由でブラウザ内埋め込みはできません。
          </p>
          
          <div className="flex flex-col gap-2">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-black text-white text-sm rounded text-center hover:bg-gray-800"
            >
              Googleで検索 ↗
            </a>
            <a
              href={`https://duckduckgo.com/?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 border text-sm rounded text-center hover:bg-gray-50"
            >
              DuckDuckGoで検索 ↗
            </a>
          </div>
        </div>
      )}

      {/* AIモード */}
      {mode === 'ai' && (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
          {hasContext && (
            <div className="text-xs text-gray-400">
              選択テキスト：<span className="text-gray-600">「{query.slice(0, 50)}{query.length > 50 ? '...' : ''}」</span>
            </div>
          )}
          {hasContext && (
            <>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="AIへの質問を入力..."
                className="w-full border rounded px-2 py-1 text-sm outline-none focus:border-black resize-none"
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.metaKey) handleAI()
                }}
              />
              <button
                onClick={() => handleAI()}
                disabled={loading}
                className="w-full py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-300"
              >
                {loading ? '生成中...' : '送信（⌘+Enter）'}
              </button>
            </>
          )}
          {loading && (
            <div className="text-xs text-gray-400">生成中...</div>
          )}
          {aiResult && (
            <div className="text-sm bg-gray-50 rounded p-3 whitespace-pre-wrap">
              {aiResult}
            </div>
          )}
        </div>
      )}
    </div>
  )
}