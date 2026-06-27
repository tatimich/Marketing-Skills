'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { corStatus, corPrazo, labelPrazo, formatarData, diasRestantes } from '@/lib/utils'
import { FolderOpen, FileWarning, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Processo } from '@/types'

export default function IESDashboard() {
  const supabase = createClient()
  const [processos, setProcessos] = useState<Processo[]>([])
  const [totalPendencias, setTotalPendencias] = useState(0)

  useEffect(() => {
    async function carregar() {
      const { data: p } = await supabase
        .from('processos')
        .select('*')
        .neq('status', 'Arquivado')
        .order('prazo_externo', { ascending: true })
      setProcessos(p ?? [])

      if (p?.length) {
        const ids = p.map((x: Processo) => x.id)
        const { count } = await supabase
          .from('pendencias_documentais')
          .select('id', { count: 'exact', head: true })
          .in('processo_id', ids)
          .in('status', ['Pendente', 'Devolvido para correção'])
        setTotalPendencias(count ?? 0)
      }
    }
    carregar()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meus processos</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhamento dos processos perante SERES/MEC</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{processos.length}</p>
              <p className="text-xs text-gray-500">Processos ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${totalPendencias > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <FileWarning className={totalPendencias > 0 ? 'text-red-500' : 'text-green-500'} size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalPendencias}</p>
              <p className="text-xs text-gray-500">Documentos pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {processos.map((p) => {
          const dias = diasRestantes(p.prazo_externo)
          return (
            <Link key={p.id} href={`/ies/processos/${p.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-blue-700">{p.id_interno}</p>
                      <p className="text-sm text-gray-800 mt-0.5">{p.assunto}</p>
                      {p.curso && <p className="text-xs text-gray-400 mt-0.5">Curso: {p.curso}</p>}
                    </div>
                    <Badge className={corStatus(p.status)}>{p.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> Prazo: {formatarData(p.prazo_externo)}</span>
                    <span className={`font-medium ${corPrazo(dias)}`}>{labelPrazo(dias)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {!processos.length && (
          <p className="text-sm text-gray-400 text-center py-12">
            Nenhum processo ativo no momento.
          </p>
        )}
      </div>
    </div>
  )
}
