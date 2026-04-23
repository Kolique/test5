'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  async function onClick() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }
  return (
    <button
      onClick={onClick}
      title="Se déconnecter"
      className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    >
      <LogOut className="h-4 w-4" />
    </button>
  )
}
