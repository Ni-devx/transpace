'use client'

import { useSearchParams } from 'next/navigation'
import RightPanel from '@/features/editor/RightPanel'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''

  return (
    <RightPanel
      mode="search"
      initialQuery={query}
      hasContext={false}
      layout="full"
      showClose={false}
    />
  )
}
