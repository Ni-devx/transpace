'use client'

import { AuthAPI } from '@/lib/auth'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Transpace</h1>
        <button
          onClick={() => AuthAPI.signInWithGoogle()}
          className="px-6 py-3 bg-black text-white rounded-lg"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  )
}