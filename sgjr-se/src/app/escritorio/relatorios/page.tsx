'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { formatarData, corStatus, corRisco } from '@/lib/utils'
import { Download, BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Processo, StatusProcesso } from '@/types'
import { STATUS_PROCESSO_LISTA } from '@/types'

function converterParaCSV(linhas: Record<string, string | number | null>[]): string {
  if (!linhas.length) return ''
  const headers = Object.keys(linhas[0])
  const rows = linhas.map((row) =>
    headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

function baixarCSV(conteudo: string, nomeArquivo: string) {
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

export default function RelatoriosPage() {
  const supabase = createClient()
  const [processos, setProcessos] = useState<(Processo & { ies: { nome: string } | null })[]>([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [gerado, setGerado] = useState(false)

  async function gerarRelatorio() {
    setCarregando(true)
    let query = supabase.from('processos').select('*, ies(nome)').order('prazo_externo')
    if (filtroStatus) query = query.eq('status', filtroStatus as StatusProcesso)
    const { data } = await query
    setProcessos((data as any) ?? [])
    setGerado(true)
    setCarregando(false)
  }

  function exportarProcessos() {
    const linhas = processos.map((p) => ({
      'ID Interno': p.id_interno,
      'IES': (p as any).ies?.nome ?? '',
      'Assunto': p.assunto,
      'Tipo de comunicação': p.tipo_comunicacao,
      'Status': p.status,
      'Risco': p.risco,
      'N° SEI': p.numero_sei ?? '',
      'N° e-MEC': p.numero_emec ?? '',
      'Curso': p.curso ?? '',
      'Polo': p.polo ?? '',
      'Data de ciência': formatarData(p.data_ciencia),
      'Prazo externo': formatarData(p.prazo_externo),
      'Prazo interno': formatarData(p.prazo_interno),
      'Cadastrado em': formatarData(p.criado_em),
    }))
    baixarCSV(converterParaCSV(linhas), `processos_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios e Exportação</h1>
        <p className="text-sm text-gray-500 mt-1">Gere e exporte dados dos processos em formato CSV.</p>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Filtros do relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-64">
              <Select
                id="filtro_status"
                label="Status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                options={STATUS_PROCESSO_LISTA.map((s) => ({ value: s, label: s }))}
                placeholder="Todos os status"
              />
            </div>
            <Button onClick={gerarRelatorio} disabled={carregando}>
              <BarChart3 size={15} />
              {carregando ? 'Gerando…' : 'Gerar relatório'}
            </Button>
            {gerado && processos.length > 0 && (
              <Button variant="secondary" onClick={exportarProcessos}>
                <Download size={15} />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {gerado && (
        <Card>
          <CardHeader>
            <CardTitle>{processos.length} processo(s) encontrado(s)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IES</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assunto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risco</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prazo ext.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{p.id_interno}</td>
                    <td className="px-4 py-3 text-gray-700">{(p as any).ies?.nome}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{p.assunto}</td>
                    <td className="px-4 py-3"><Badge className={corStatus(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-3"><Badge className={corRisco(p.risco)}>{p.risco}</Badge></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatarData(p.prazo_externo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
