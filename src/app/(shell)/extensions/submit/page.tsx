'use client'

import { useState } from 'react'

export default function SubmitExtensionPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    githubUrl: '',
    permissions: [] as string[],
    category: 'other',
  })
  const [submitted, setSubmitted] = useState(false)

  const PERMISSIONS = ['storage', 'ai', 'timer', 'notification', 'event']
  const CATEGORIES = ['productivity', 'ai', 'review', 'other']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // GitHubのIssueとしてPRを促す（将来的にGitHub API連携）
    const issueBody = encodeURIComponent(`
## 拡張機能申請

**名前:** ${form.name}
**説明:** ${form.description}
**GitHubリポジトリ:** ${form.githubUrl}
**必要な権限:** ${form.permissions.join(', ')}
**カテゴリ:** ${form.category}
    `)

    window.open(
      `https://github.com/Ni-devx/transpace/issues/new?title=拡張機能申請: ${form.name}&body=${issueBody}`,
      '_blank'
    )
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-2xl mb-2">🎉</div>
        <div className="font-medium">申請を受け付けました</div>
        <div className="text-sm text-gray-400 mt-1">
          GitHubのIssueを確認してください
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h1 className="text-lg font-bold">拡張機能を申請する</h1>
        <p className="text-xs text-gray-400 mt-1">
          審査後にマーケットプレイスに公開されます
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-lg flex flex-col gap-4">

          <div>
            <label className="text-sm font-medium">拡張機能名</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full border rounded px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="ポモドーロタイマー"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">説明</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 w-full border rounded px-3 py-2 text-sm outline-none focus:border-black resize-none"
              placeholder="この拡張機能は..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">GitHubリポジトリURL</label>
            <input
              value={form.githubUrl}
              onChange={e => setForm(prev => ({ ...prev, githubUrl: e.target.value }))}
              className="mt-1 w-full border rounded px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="https://github.com/username/extension-name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">必要な権限</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p)}
                    onChange={e => {
                      setForm(prev => ({
                        ...prev,
                        permissions: e.target.checked
                          ? [...prev.permissions, p]
                          : prev.permissions.filter(x => x !== p)
                      }))
                    }}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">カテゴリ</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 w-full border rounded px-3 py-2 text-sm outline-none focus:border-black"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
          >
            GitHubで申請する
          </button>
        </form>
      </div>
    </div>
  )
}