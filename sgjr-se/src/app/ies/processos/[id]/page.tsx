'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { corStatus, formatarData, formatarDataHora, diasRestantes, corPrazo, labelPrazo, corPendencia } from '@/lib/utils'
import { ChevronLeft, ExternalLink, Upload, Clock, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { Processo, Andamento, PendenciaDocumental, Documento, Protocolo } from '@/types'

// Campos que NÃO devem ser exibidos à IES:
// - observacoes_internas do processo
// - andamentos com visibilidade='Interno'
// - documentos com visibilidade='Interno'
// - manifestacoes (exceto as enviadas para assinatura/assinadas)
// - riscos

export default function IESProcessoPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [processo, setProcesso] = useState<Processo | null>(null)
  const [andamentos, setAndamentos] = useState<Andamento[]>([])
  const [pendencias, setPendencias] = useState<PendenciaDocumental[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [protocolo, setProtocolo] = useState<Protocolo | null>(null)

  // Modal: enviar link de documento para pendência
  const [modalEnvio, setModalEnvio] = useState(false)
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState<PendenciaDocumental | null>(null)
  const [linkDocumento, setLinkDocumento] = useState('')
  const [observacaoIES, setObservacaoIES] = useState('')
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(async () => {
    const [
      { data: p },
      { data: a },
      { data: pe },
      { data: d },
      { data: pr },
    ] = await Promise.all([
      supabase.from('processos').select('id, id_interno, assunto, curso, polo, numero_sei, numero_emec, tipo_comunicacao, data_ciencia, prazo_externo, prazo_interno, status, risco, criado_em, atualizado_em').eq('id', id).single(),
      supabase.from('andamentos').select('*').eq('processo_id', id).eq('visibilidade', 'Cliente').order('data', { ascending: false }),
      supabase.from('pendencias_documentais').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
      supabase.from('documentos').select('*').eq('processo_id', id).eq('visibilidade', 'Cliente').order('criado_em', { ascending: false }),
      supabase.from('protocolos').select('*').eq('processo_id', id).maybeSingle(),
    ])
    setProcesso(p as Processo)
    setAndamentos(a ?? [])
    setPendencias(pe ?? [])
    setDocumentos(d ?? [])
    setProtocolo(pr)
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  function abrirEnvio(pendencia: PendenciaDocumental) {
    setPendenciaSelecionada(pendencia)
    setLinkDocumento('')
    setObservacaoIES('')
    setModalEnvio(true)
  }

  async function enviarDocumento(e: React.FormEvent) {
    e.preventDefault()
    if (!pendenciaSelecionada) return
    setEnviando(true)

    await Promise.all([
      supabase.from('pendencias_documentais').update({
        status: 'Enviado pela IES',
        data_recebimento: new Date().toISOString().split('T')[0],
        observacoes_ies: observacaoIES || null,
        iteracao: (pendenciaSelecionada.iteracao ?? 1) + (pendenciaSelecionada.status !== 'Pendente' ? 1 : 0),
      }).eq('id', pendenciaSelecionada.id),
      linkDocumento && supabase.from('documentos').insert({
        processo_id: id,
        pendencia_id: pendenciaSelecionada.id,
        nome: pendenciaSelecionada.documento_solicitado,
        tipo: 'Documento IES',
        origem: 'IES',
        local_link: linkDocumento,
        visibilidade: 'Interno',
      }),
    ])

    setEnviando(false)
    setModalEnvio(false)
    carregar()
  }

  if (!processo) return <div className="text-sm text-gray-400 py-8">Carregando…</div>

  const diasExt = diasRestantes(processo.prazo_externo)
  const pendenciasAbertas = pendencias.filter(p => !['Validado'].includes(p.status))

  return (
    <div>
      <Link href="/ies" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft size={14} /> Meus processos
      </Link>

      {/* Cabeçalho */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400 font-mono">{processo.id_interno}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{processo.assunto}</h1>
            {processo.tipo_comunicacao && <p className="text-sm text-gray-500 mt-0.5">{processo.tipo_comunicacao}</p>}
          </div>
          <Badge className={corStatus(processo.status)}>{processo.status}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-gray-400">Data de ciência</p>
            <p className="font-medium text-gray-700 mt-0.5">{formatarData(processo.data_ciencia)}</p>
          </div>
          <div>
            <p className="text-gray-400">Prazo externo</p>
            <p className={`font-semibold mt-0.5 ${corPrazo(diasExt)}`}>{formatarData(processo.prazo_externo)} · {labelPrazo(diasExt)}</p>
          </div>
          {processo.curso && <div><p className="text-gray-400">Curso</p><p className="font-medium text-gray-700 mt-0.5">{processo.curso}</p></div>}
          {processo.polo && <div><p className="text-gray-400">Polo</p><p className="font-medium text-gray-700 mt-0.5">{processo.polo}</p></div>}
          {processo.numero_sei && <div><p className="text-gray-400">N° SEI</p><p className="font-mono text-gray-700 mt-0.5">{processo.numero_sei}</p></div>}
        </div>
      </div>

      {/* Pendências */}
      {pendenciasAbertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-3">
            <Clock size={15} /> {pendenciasAbertas.length} pendência(s) aguardando envio
          </p>
          <div className="flex flex-col gap-2">
            {pendenciasAbertas.map((p) => (
              <div key={p.id} className="bg-white border border-amber-200 rounded-md p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.documento_solicitado}</p>
                    {p.instrucao && <p className="text-xs text-gray-500 mt-0.5">{p.instrucao}</p>}
                    {p.prazo_envio && <p className="text-xs text-red-600 mt-0.5 font-medium">Enviar até: {formatarData(p.prazo_envio)}</p>}
                    {p.observacoes_escritorio && (
                      <p className="text-xs text-orange-700 mt-1 bg-orange-50 px-2 py-1 rounded">
                        Observação do escritório: {p.observacoes_escritorio}
                      </p>
                    )}
                  </div>
                  <Badge className={corPendencia(p.status)}>{p.status}</Badge>
                </div>
                {['Pendente', 'Devolvido para correção'].includes(p.status) && (
                  <Button size="sm" variant="secondary" className="mt-2" onClick={() => abrirEnvio(p)}>
                    <Upload size={13} /> Enviar documento
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Andamentos visíveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <MessageSquare size={15} className="text-gray-400" />
              Andamentos do processo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-y-auto">
            {!andamentos.length ? (
              <p className="text-sm text-gray-400 px-5 py-4">Nenhum andamento disponível.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {andamentos.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <p className="text-sm text-gray-800">{a.descricao}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatarDataHora(a.data)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Documentos compartilhados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <FileText size={15} className="text-gray-400" />
              Documentos compartilhados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-y-auto">
            {!documentos.length ? (
              <p className="text-sm text-gray-400 px-5 py-4">Nenhum documento disponível.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {documentos.map((d) => (
                  <li key={d.id} className="px-5 py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.nome}</p>
                      <p className="text-xs text-gray-400">{d.tipo} · {formatarData(d.data)}</p>
                    </div>
                    <a href={d.local_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                      <ExternalLink size={15} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Todas as pendências (histórico) */}
        {pendencias.length > pendenciasAbertas.length && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Histórico de pendências documentais</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-100">
                {pendencias.filter(p => p.status === 'Validado').map((p) => (
                  <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-700">{p.documento_solicitado}</p>
                    <Badge className={corPendencia(p.status)}>{p.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Protocolo */}
        {protocolo && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Protocolo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Modalidade</p><p className="font-medium mt-0.5">{protocolo.modalidade}</p></div>
                <div><p className="text-xs text-gray-400">Data</p><p className="font-medium mt-0.5">{formatarData(protocolo.data)}</p></div>
                <div><p className="text-xs text-gray-400">Status</p><Badge className="bg-green-100 text-green-700">{protocolo.status}</Badge></div>
                {protocolo.numero_sei && <div><p className="text-xs text-gray-400">N° SEI</p><p className="font-mono mt-0.5">{protocolo.numero_sei}</p></div>}
                {protocolo.comprovante_link && (
                  <div>
                    <p className="text-xs text-gray-400">Comprovante</p>
                    <a href={protocolo.comprovante_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-0.5">
                      <ExternalLink size={12} /> Abrir
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de envio de documento */}
      <Modal open={modalEnvio} onClose={() => setModalEnvio(false)} title="Enviar documento" size="md">
        <form onSubmit={enviarDocumento} className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
            <p className="text-sm font-medium text-blue-900">{pendenciaSelecionada?.documento_solicitado}</p>
            {pendenciaSelecionada?.instrucao && (
              <p className="text-xs text-blue-700 mt-1">{pendenciaSelecionada.instrucao}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Link do documento (Google Drive, Dropbox, etc.)
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://drive.google.com/…"
              value={linkDocumento}
              onChange={(e) => setLinkDocumento(e.target.value)}
              type="url"
            />
            <p className="text-xs text-gray-400 mt-1">Se preferir, compartilhe o link de acesso ao documento.</p>
          </div>
          <Textarea
            label="Observações (opcional)"
            value={observacaoIES}
            onChange={(e) => setObservacaoIES(e.target.value)}
            placeholder="Informe o que foi enviado, versão, data ou qualquer informação relevante…"
            rows={3}
          />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalEnvio(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Confirmar envio'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
