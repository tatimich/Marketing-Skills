'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  Clock,
  FileWarning,
  FileText,
  ScrollText,
  BarChart3,
  LogOut,
  Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/escritorio', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/escritorio/ies', label: 'Instituições (IES)', icon: Building2 },
  { href: '/escritorio/processos', label: 'Processos', icon: FolderOpen },
  { href: '/escritorio/prazos', label: 'Prazos', icon: Clock },
  { href: '/escritorio/pendencias', label: 'Pendências', icon: FileWarning },
  { href: '/escritorio/documentos', label: 'Documentos', icon: FileText },
  { href: '/escritorio/manifestacoes', label: 'Manifestações', icon: ScrollText },
  { href: '/escritorio/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-slate-900 flex flex-col min-h-screen">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
          <Scale size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">SGJR-SE</p>
          <p className="text-slate-400 text-xs">Escritório</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-700 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
