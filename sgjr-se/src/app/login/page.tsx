'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scale } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
              <Scale className="text-white" size={22} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center">SGJR-SE</h1>
            <p className="text-xs text-gray-500 text-center">
              Esmeraldo Malheiros Advocacia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
            <Input
              id="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {erro}
              </p>
            )}

            <Button type="submit" disabled={carregando} className="w-full mt-2">
              {carregando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Sistema de Gestão Jurídico-Regulatória da Supervisão Educacional
        </p>
      </div>
    </div>
  )
}
