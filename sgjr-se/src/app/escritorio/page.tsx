export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { corStatus, corRisco, formatarData, diasRestantes, corPrazo, labelPrazo } from '@/lib/utils'
import {
  FolderOpen,
  Clock,
  FileWarning,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import type { Processo, Prazo } from '@/types'

async function getDashboardData() {
  const supabase = await createClient()

  const [
    { data: processos },
    { data: prazosVencendo },
    { data: pendencias },
    { data: processosAtivos },
  ] = await Promise.all([
    supabase.from('processos').select('id, status').neq('status', 'Arquivado'),
    supabase
      .from('prazos')
      .select('*, processos(id_interno, assunto, ies:ies(nome))')
      .neq('status', 'Cumprido')
      .lte('data_final', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      .order('data_final', { ascending: true })
      .limit(10),
    supabase
      .from('pendencias_documentais')
      .select('id')
      .in('status', ['Pendente', 'Devolvido para correção']),
    supabase
      .from('processos')
      .select('*, ies(nome)')
      .neq('status', 'Arquivado')
      .order('prazo_externo', { ascending: true })
      .limit(8),
  ])

  return { processos, prazosVencendo, pendencias, processosAtivos }
}

export default async function DashboardPage() {
  const { processos, prazosVencendo, pendencias, processosAtivos } = await getDashboardData()

  const totalAtivos = processos?.length ?? 0
  const totalPrazos = prazosVencendo?.length ?? 0
  const totalPendencias = pendencias?.length ?? 0

  const statusContagem: Record<string, number> = {}
  processos?.forEach((p) => {
    statusContagem[p.status] = (statusContagem[p.status] ?? 0) + 1
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral dos processos ativos</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAtivos}</p>
              <p className="text-sm text-gray-500">Processos ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalPrazos > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
              <Clock className={totalPrazos > 0 ? 'text-amber-600' : 'text-green-600'} size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPrazos}</p>
              <p className="text-sm text-gray-500">Prazos em 7 dias</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalPendencias > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <FileWarning className={totalPendencias > 0 ? 'text-red-600' : 'text-green-600'} size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPendencias}</p>
              <p className="text-sm text-gray-500">Pendências abertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prazos próximos */}
        <Card>
          <CardHeader>
            <CardTitle>Prazos próximos (7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!prazosVencendo?.length ? (
              <p className="text-sm text-gray-500 px-5 py-4">Nenhum prazo nos próximos 7 dias.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {prazosVencendo.map((prazo: Prazo & { processos: Processo & { ies: { nome: string } } | null }) => {
                  const dias = diasRestantes(prazo.data_final)
                  return (
                    <li key={prazo.id} className="px-5 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {(prazo as any).processos?.id_interno} – {(prazo as any).processos?.assunto}
                        </p>
                        <p className="text-xs text-gray-500">{(prazo as any).processos?.ies?.nome}</p>
                        <p className="text-xs mt-0.5">{prazo.tipo} · vence {formatarData(prazo.data_final)}</p>
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${corPrazo(dias)}`}>
                        {labelPrazo(dias)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Processos recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Processos ativos</CardTitle>
            <Link href="/escritorio/processos" className="text-xs text-blue-600 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!processosAtivos?.length ? (
              <p className="text-sm text-gray-500 px-5 py-4">Nenhum processo ativo.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {processosAtivos.map((p: Processo & { ies: { nome: string } | null }) => {
                  const dias = diasRestantes(p.prazo_externo)
                  return (
                    <li key={p.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/escritorio/processos/${p.id}`}
                            className="text-sm font-medium text-blue-700 hover:underline truncate block"
                          >
                            {p.id_interno}
                          </Link>
                          <p className="text-xs text-gray-500 truncate">{(p as any).ies?.nome}</p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{p.assunto}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge className={corStatus(p.status)}>{p.status}</Badge>
                          {p.risco && (
                            <Badge className={corRisco(p.risco)}>{p.risco}</Badge>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${corPrazo(dias)}`}>
                        Prazo externo: {formatarData(p.prazo_externo)} · {labelPrazo(dias)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Status por categoria */}
        {Object.keys(statusContagem).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processos por status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusContagem).map(([status, qty]) => (
                  <div key={status} className="flex items-center gap-2">
                    <Badge className={corStatus(status as any)}>{status}</Badge>
                    <span className="text-sm text-gray-500">{qty}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
