'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Scale, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function IESLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
            <Scale size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">SGJR-SE</p>
            <p className="text-xs text-gray-400">Portal da IES</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/ies" className="text-sm text-gray-600 hover:text-gray-900">Meus processos</Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <LogOut size={14} /> Sair
          </button>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  )
}
