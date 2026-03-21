'use client'

import { useState, useEffect, useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'
import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax/browser'
import { AI_API } from '@/core/api/ai'
import ResizablePane from '@/features/shell/ResizablePane'

type Mode = 'search' | 'ai'
type Scope = 'selection' | 'note' | 'global'

type Props = {
  mode: Mode
  initialQuery: string
  hasContext: boolean
  contextText?: string
  contextLabel?: string
  initialPrompt?: string
  scope?: Scope
  systemPrompt?: string
  disabled?: boolean
  disabledReason?: string
  layout?: 'sidebar' | 'full'
  showClose?: boolean
  onClose?: () => void
}

type Message = {
  role: 'user' | 'ai'
  content: string
}

export default function RightPanel({
  mode,
  initialQuery,
  hasContext,
  contextText,
  contextLabel,
  initialPrompt,
  scope,
  systemPrompt,
  disabled = false,
  disabledReason,
  layout = 'sidebar',
  showClose = true,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const initialSent = useRef(false)
  const [mathjaxReady, setMathjaxReady] = useState(false)
  const [panelWidth, setPanelWidth] = useState(320)

  useEffect(() => {
    setQuery(initialQuery)
    setDraft('')
    setMessages([])
    setLoading(false)
    initialSent.current = false
  }, [mode, initialQuery, hasContext, contextText, initialPrompt])

  useEffect(() => {
    if (mode !== 'ai') return
    if (!mathjaxReady) return
    const mj = (window as unknown as { MathJax?: { typesetPromise?: () => Promise<void> } }).MathJax
    mj?.typesetPromise?.()
  }, [messages, mode, mathjaxReady])

  useEffect(() => {
    if (mode !== 'ai') return
    if (typeof window === 'undefined') return

    const w = window as unknown as {
      MathJax?: unknown
      __mathjaxLoaded?: boolean
      __mathjaxLoading?: boolean
    }

    if (w.__mathjaxLoaded) {
      setMathjaxReady(true)
      return
    }
    if (w.__mathjaxLoading) return

    w.__mathjaxLoading = true
    // MathJaxの読み込み前に設定を定義
    ;(window as unknown as { MathJax: unknown }).MathJax = {
      tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
      },
      svg: { fontCache: 'global' },
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
    script.async = true
    script.onload = () => {
      w.__mathjaxLoaded = true
      w.__mathjaxLoading = false
      setMathjaxReady(true)
    }
    script.onerror = () => {
      w.__mathjaxLoading = false
    }
    document.head.appendChild(script)
  }, [mode])

  const buildContext = (history: Message[]) => {
    const parts: string[] = []
    if (hasContext) {
      const ctx = contextText ?? initialQuery
      if (ctx) parts.push(`選択テキスト:\n${ctx}`)
    }
    if (history.length > 0) {
      const transcript = history
        .map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
        .join('\n')
      parts.push(`会話履歴:\n${transcript}`)
    }
    return parts.join('\n\n')
  }

  const handleAI = async (promptOverride?: string) => {
    if (disabled) return
    const prompt = (promptOverride ?? draft).trim()
    if (!prompt || loading) return
    setLoading(true)
    setDraft('')
    const history = messages
    setMessages(prev => [...prev, { role: 'user', content: prompt }])

    try {
      const context = buildContext(history)
      const res = context
        ? await AI_API.ask(prompt, { context, systemPrompt })
        : await AI_API.ask(prompt, { systemPrompt })
      setMessages(prev => [...prev, { role: 'ai', content: res.content }])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: 'エラーが発生しました。しばらくしてから再試行してください。' },
      ])
    } finally {
      setLoading(false)
    }
  }

  // トップバーからの場合（hasContext: false）は即送信
  useEffect(() => {
    if (mode !== 'ai') return
    if (disabled) return
    if (initialSent.current) return
    const preferred = initialPrompt?.trim()
    const fallback = !hasContext ? initialQuery.trim() : ''
    const initial = preferred || fallback
    if (initial) {
      initialSent.current = true
      handleAI(initial)
    }
  }, [mode, hasContext, initialQuery, initialPrompt, disabled])

  const panelContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
          {mode === 'search'
            ? '検索'
            : scope === 'selection'
              ? 'AI（選択）'
              : scope === 'note'
                ? 'AI（ノート）'
                : scope === 'global'
                  ? 'AI（横断）'
                  : 'AI'}
        </span>
        {showClose && onClose && (
          <button
            onClick={() => onClose?.()}
            className="text-gray-400 hover:text-black text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* クエリ表示（検索のみ） */}
      {mode === 'search' && (
        <div className="px-3 py-2 border-b">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-black"
            placeholder="検索ワードを入力..."
          />
        </div>
      )}

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
        <div className="flex-1 min-h-0 flex flex-col">
          {hasContext && (
            <div className="px-3 py-2 border-b text-xs text-gray-500">
              {contextLabel ? (
                <span className="text-gray-700">{contextLabel}</span>
              ) : (
                <>
                  選択テキスト：
                  <span className="text-gray-700">「{(contextText ?? initialQuery).slice(0, 120)}{(contextText ?? initialQuery).length > 120 ? '...' : ''}」</span>
                </>
              )}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
            {disabled && disabledReason && (
              <div className="text-xs text-gray-400">
                {disabledReason}
              </div>
            )}
            {messages.length === 0 && !loading && (
              <div className="text-xs text-gray-400">
                AIに質問を送ると、ここに会話が表示されます。
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`text-sm rounded px-3 py-2 ${
                  m.role === 'user'
                    ? 'bg-gray-900 text-white self-end'
                    : 'bg-gray-50 text-gray-900 self-start border'
                }`}
              >
                {m.role === 'ai' ? (
                  <div data-color-mode="light">
                    <MDEditor.Markdown
                      source={m.content}
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeMathjax]}
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400">生成中...</div>
            )}
          </div>

          <div className="border-t p-3 flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="AIへの質問を入力..."
              className="w-full border rounded px-2 py-1 text-sm outline-none focus:border-black resize-none disabled:bg-gray-50"
              rows={3}
              disabled={disabled}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleAI()
                }
              }}
            />
            <button
              onClick={() => handleAI()}
              disabled={loading || disabled || !draft.trim()}
              className="w-full py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-300"
            >
              {loading ? '生成中...' : '送信（⌘/Ctrl+Enter）'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (layout === 'sidebar') {
    return (
      <ResizablePane
        width={panelWidth}
        onWidthChange={setPanelWidth}
        minWidth={260}
        maxWidth={560}
        side="right"
        className="border-l bg-white"
      >
        {panelContent}
      </ResizablePane>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white">
      {panelContent}
    </div>
  )
}
