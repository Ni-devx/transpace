'use client'

import { useState } from 'react'
import { AI_API } from '@/core/api/ai'

type Mode = 'search' | 'ai'

type Props = {
  mode: Mode
  initialQuery: string
  onClose: () => void
}

export default function RightPanel({ mode, initialQuery, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAI = async () => {
    if (!aiPrompt.trim()) return
    setLoading(true)
    setAiResult('')
    const res = await AI_API.ask(aiPrompt, { context: query })
    setAiResult(res.content)
    setLoading(false)
  }

  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`

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
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b">
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              ブラウザで開く ↗
            </a>
          </div>
          <iframe
            src={searchUrl}
            className="flex-1 w-full"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      )}

      {/* AIモード */}
      {mode === 'ai' && (
        <div className="flex-1 flex flex-col p-3 gap-3">
          <div className="text-xs text-gray-400">
            選択テキスト：<span className="text-gray-600">「{query.slice(0, 50)}{query.length > 50 ? '...' : ''}」</span>
          </div>
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
            onClick={handleAI}
            disabled={loading}
            className="w-full py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-300"
          >
            {loading ? '生成中...' : '送信（⌘+Enter）'}
          </button>
          {aiResult && (
            <div className="flex-1 overflow-y-auto text-sm bg-gray-50 rounded p-3 whitespace-pre-wrap">
              {aiResult}
            </div>
          )}
        </div>
      )}
    </div>
  )
}