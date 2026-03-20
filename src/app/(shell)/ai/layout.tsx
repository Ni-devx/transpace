import Link from 'next/link'

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="w-64 border-r flex flex-col">
        <div className="px-4 py-3 border-b">
          <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            AI
          </span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <Link
            href="/ai"
            className="w-full py-2 px-3 text-sm border rounded hover:bg-gray-50 text-left"
          >
            新しいチャット
          </Link>
          <p className="text-xs text-gray-400">
            数式は <span className="font-mono">\\(...\\)</span> / <span className="font-mono">\\[...\\]</span> で入力できます。
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </>
  )
}
