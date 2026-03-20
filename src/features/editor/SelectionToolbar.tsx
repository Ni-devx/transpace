'use client'

type Props = {
  position: { x: number; y: number }
  selectedText: string
  onSearch: (text: string) => void
  onAI: (text: string) => void
}

export default function SelectionToolbar({ position, selectedText, onSearch, onAI }: Props) {
  return (
    <div
      data-selection-toolbar
      className="fixed z-50 flex items-center gap-1 bg-white border rounded-lg shadow-lg px-2 py-1"
      style={{ top: position.y - 48, left: position.x }}
    >
      <button
        onMouseDown={e => {
          e.preventDefault()
          onSearch(selectedText)
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-100 rounded"
        title="検索"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        検索
      </button>
      <div className="w-px h-4 bg-gray-200" />
      <button
        onMouseDown={e => {
          e.preventDefault()
          onAI(selectedText)
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-100 rounded"
        title="AIに質問"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-2.303 2.596A3.75 3.75 0 0112 20.25a3.75 3.75 0 01-1.768-.418 3.75 3.75 0 01-2.303-2.596l-.347-.347z" />
        </svg>
        AI
      </button>
    </div>
  )
}