'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthAPI } from '@/lib/auth'

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AuthAPI.getUser().then(user => {
      if (!user) router.push('/')
      else setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400">読み込み中...</div>
    </div>
  )

  return <>{children}</>
}