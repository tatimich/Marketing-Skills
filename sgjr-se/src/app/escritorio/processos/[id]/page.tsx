'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  corStatus, corRisco, formatarData, formatarDataHora,
  diasRestantes, corPrazo, labelPrazo, corPendencia
} from '@/lib/utils'
import {
  Plus, ExternalLink, AlertTriangle, CheckCircle,
  Clock, FileText, ScrollText, MessageSquare, ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import type {
  Processo, IES, Andamento, PendenciaDocumental,
  Documento, Manifestacao, Protocolo, Perfil,
  StatusProcesso, StatusPendencia, Visibilidade, StatusManifestacao,
} from '@/types'
import {
  STATUS_PROCESSO_LISTA, STATUS_PENDENCIA_LISTA,
  STATUS_MANIFESTACAO_LISTA, NIVEL_RISCO_LISTA,
} from '@/types'

type ProcessoCompleto = Processo & { ies: IES | null; responsavel: Perfil | null }

export default function ProcessoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [processo, setProcesso] = useState<ProcessoCompleto | null>(null)
  const [andamentos, setAndamentos] = useState<Andamento[]>([])
  const [pendencias, setPendencias] = useState<PendenciaDocumental[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([])
  const [protocolo, setProtocolo] = useState<Protocolo | null>(null)
  const [usuarios, setUsuarios] = useState<Perfil[]>([])

  // Modais
  const [modalAndamento, setModalAndamento] = useState(false)
  const [modalPendencia, setModalPendencia] = useState(false)
  const [modalDocumento, setModalDocumento] = useState(false)
  const [modalManifestacao, setModalManifestacao] = useState(false)
  const [modalProtocolo, setModalProtocolo] = useState(false)
  const [modalStatus, setModalStatus] = useState(false)

  const [novoAndamento, setNovoAndamento] = useState({ descricao: '', visibilidade: 'Interno' as Visibilidade })
  const [novaPendencia, setNovaPendencia] = useState({ documento_solicitado: '', instrucao: '', responsavel_ies: '', prazo_envio: '' })
  const [novoDocumento, setNovoDocumento] = useState({ nome: '', tipo: '', origem: 'IES', local_link: '', visibilidade: 'Interno' as Visibilidade })
  const [novaManifestacao, setNovaManifestacao] = useState({ versao: 1, status: 'Em elaboração' as StatusManifestacao, data_limite_assinatura: '' })
  const [novoProtocolo, setNovoProtocolo] = useState({ modalidade: 'Eletrônico' as 'Eletrônico' | 'Presencial', data: '', comprovante_link: '', numero_sei: '', manifestacao_assinada_link: '', documentos_protocolados: '' })
  const [novoStatus, setNovoStatus] = useState<StatusProcesso>('Recebido')

  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const [
      { data: p },
      { data: a },
      { data: pe },
      { data: d },
      { data: m },
      { data: pr },
      { data: u },
    ] = await Promise.all([
      supabase.from('processos').select('*, ies(*), responsavel:perfis!responsavel_id(*)').eq('id', id).single(),
      supabase.from('andamentos').select('*, responsavel:perfis(nome)').eq('processo_id', id).order('data', { ascending: false }),
      supabase.from('pendencias_documentais').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
      supabase.from('documentos').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
      supabase.from('manifestacoes').select('*').eq('processo_id', id).order('versao', { ascending: false }),
      supabase.from('protocolos').select('*').eq('processo_id', id).maybeSingle(),
      supabase.from('perfis').select('*').in('perfil', ['advogada_responsavel', 'advogado_revisor', 'assistente']).eq('ativo', true),
    ])
    setProcesso(p as ProcessoCompleto)
    setAndamentos(a ?? [])
    setPendencias(pe ?? [])
    setDocumentos(d ?? [])
    setManifestacoes(m ?? [])
    setProtocolo(pr)
    setUsuarios(u ?? [])
    if (p) setNovoStatus(p.status)
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function salvarAndamento(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    await supabase.from('andamentos').insert({ processo_id: id, ...novoAndamento })
    setModalAndamento(false); setNovoAndamento({ descricao: '', visibilidade: 'Interno' }); setSalvando(false); carregar()
  }

  async function salvarPendencia(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    await supabase.from('pendencias_documentais').insert({ processo_id: id, ...novaPendencia, prazo_envio: novaPendencia.prazo_envio || null })
    setModalPendencia(false); setSalvando(false); carregar()
  }

  async function salvarDocumento(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    await supabase.from('documentos').insert({ processo_id: id, ...novoDocumento })
    setModalDocumento(false); setSalvando(false); carregar()
  }

  async function salvarManifestacao(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    await supabase.from('manifestacoes').insert({ processo_id: id, ...novaManifestacao, data_limite_assinatura: novaManifestacao.data_limite_assinatura || null })
    setModalManifestacao(false); setSalvando(false); carregar()
  }

  async function salvarProtocolo(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    if (novoProtocolo.modalidade === 'Eletrônico' && (!novoProtocolo.comprovante_link || !novoProtocolo.manifestacao_assinada_link || !novoProtocolo.numero_sei)) {
      alert('Protocolo eletrônico requer: comprovante, manifestação assinada e número SEI.')
      setSalvando(false); return
    }
    await supabase.from('protocolos').insert({ processo_id: id, ...novoProtocolo, comprovante_link: novoProtocolo.comprovante_link || null, numero_sei: novoProtocolo.numero_sei || null, manifestacao_assinada_link: novoProtocolo.manifestacao_assinada_link || null, documentos_protocolados: novoProtocolo.documentos_protocolados || null })
    setModalProtocolo(false); setSalvando(false); carregar()
  }

  async function atualizarStatus(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    await supabase.from('processos').update({ status: novoStatus }).eq('id', id)
    await supabase.from('andamentos').insert({ processo_id: id, descricao: `Status alterado para: ${novoStatus}`, visibilidade: 'Interno' })
    setModalStatus(false); setSalvando(false); carregar()
  }

  async function atualizarStatusPendencia(pendenciaId: string, status: StatusPendencia) {
    await supabase.from('pendencias_documentais').update({ status, ...(status === 'Validado' ? { validado_em: new Date().toISOString() } : {}) }).eq('id', pendenciaId)
    carregar()
  }

  if (!processo) return <div className="p-8 text-sm text-gray-500">Carregando…</div>

  const diasExt = diasRestantes(processo.prazo_externo)
  const diasInt = diasRestantes(processo.prazo_interno)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-5">
        <Link href="/escritorio/processos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ChevronLeft size={15} /> Processos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{processo.id_interno}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{processo.ies?.nome} · {processo.tipo_comunicacao}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={corStatus(processo.status)}>{processo.status}</Badge>
            <Badge className={corRisco(processo.risco)}>{processo.risco}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setModalStatus(true)}>Alterar status</Button>
          </div>
        </div>
      </div>

      {/* Dados básicos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div><p className="text-xs text-gray-500">Assunto</p><p className="text-sm font-medium text-gray-800 mt-0.5">{processo.assunto}</p></div>
        {processo.curso && <div><p className="text-xs text-gray-500">Curso</p><p className="text-sm text-gray-800 mt-0.5">{processo.curso}</p></div>}
        {processo.polo && <div><p className="text-xs text-gray-500">Polo</p><p className="text-sm text-gray-800 mt-0.5">{processo.polo}</p></div>}
        {processo.numero_sei && <div><p className="text-xs text-gray-500">N° SEI</p><p className="text-sm text-gray-800 mt-0.5 font-mono">{processo.numero_sei}</p></div>}
        {processo.numero_emec && <div><p className="text-xs text-gray-500">N° e-MEC</p><p className="text-sm text-gray-800 mt-0.5 font-mono">{processo.numero_emec}</p></div>}
        <div><p className="text-xs text-gray-500">Data de ciência</p><p className="text-sm text-gray-800 mt-0.5">{formatarData(processo.data_ciencia)}</p></div>
        <div>
          <p className="text-xs text-gray-500">Prazo externo</p>
          <p className={`text-sm font-semibold mt-0.5 ${corPrazo(diasExt)}`}>{formatarData(processo.prazo_externo)} · {labelPrazo(diasExt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Prazo interno</p>
          <p className={`text-sm font-semibold mt-0.5 ${corPrazo(diasInt)}`}>{formatarData(processo.prazo_interno)} · {labelPrazo(diasInt)}</p>
        </div>
        {processo.responsavel && <div><p className="text-xs text-gray-500">Responsável</p><p className="text-sm text-gray-800 mt-0.5">{processo.responsavel.nome}</p></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Andamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Andamentos ({andamentos.length})</CardTitle>
            <Button size="sm" onClick={() => setModalAndamento(true)}><Plus size={14} /></Button>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-y-auto">
            {!andamentos.length ? <p className="text-sm text-gray-400 px-5 py-4">Nenhum andamento registrado.</p> : (
              <ul className="divide-y divide-gray-100">
                {andamentos.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800">{a.descricao}</p>
                      <Badge className={a.visibilidade === 'Cliente' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}>{a.visibilidade}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatarDataHora(a.data)} {(a as any).responsavel?.nome && `· ${(a as any).responsavel.nome}`}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pendências documentais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pendências documentais ({pendencias.filter(p => p.status !== 'Validado').length} abertas)</CardTitle>
            <Button size="sm" onClick={() => setModalPendencia(true)}><Plus size={14} /></Button>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-y-auto">
            {!pendencias.length ? <p className="text-sm text-gray-400 px-5 py-4">Nenhuma pendência registrada.</p> : (
              <ul className="divide-y divide-gray-100">
                {pendencias.map((p) => (
                  <li key={p.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{p.documento_solicitado}</p>
                      <Badge className={corPendencia(p.status)}>{p.status}</Badge>
                    </div>
                    {p.instrucao && <p className="text-xs text-gray-500 mt-0.5">{p.instrucao}</p>}
                    {p.prazo_envio && <p className="text-xs text-gray-400 mt-0.5">Prazo IES: {formatarData(p.prazo_envio)}</p>}
                    {p.status === 'Enviado pela IES' && (
                      <div className="flex gap-1 mt-1.5">
                        <button onClick={() => atualizarStatusPendencia(p.id, 'Validado')} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">Validar</button>
                        <button onClick={() => atualizarStatusPendencia(p.id, 'Devolvido para correção')} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200">Devolver</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documentos ({documentos.length})</CardTitle>
            <Button size="sm" onClick={() => setModalDocumento(true)}><Plus size={14} /></Button>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {!documentos.length ? <p className="text-sm text-gray-400 px-5 py-4">Nenhum documento registrado.</p> : (
              <ul className="divide-y divide-gray-100">
                {documentos.map((d) => (
                  <li key={d.id} className="px-5 py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.nome}</p>
                      <p className="text-xs text-gray-400">{d.tipo} · v{d.versao} · {d.origem} · {formatarData(d.data)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge className={d.visibilidade === 'Cliente' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}>{d.visibilidade}</Badge>
                      <a href={d.local_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Manifestações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manifestações ({manifestacoes.length})</CardTitle>
            <Button size="sm" onClick={() => setModalManifestacao(true)}><Plus size={14} /></Button>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {!manifestacoes.length ? <p className="text-sm text-gray-400 px-5 py-4">Nenhuma manifestação registrada.</p> : (
              <ul className="divide-y divide-gray-100">
                {manifestacoes.map((m) => (
                  <li key={m.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">Versão {m.versao} · {formatarData(m.data)}</p>
                      <Badge className="bg-purple-100 text-purple-700">{m.status}</Badge>
                    </div>
                    {m.data_limite_assinatura && (
                      <p className="text-xs text-amber-600 mt-0.5">Prazo de assinatura: {formatarData(m.data_limite_assinatura)}</p>
                    )}
                    {m.data_assinatura && <p className="text-xs text-green-600 mt-0.5">Assinada em: {formatarData(m.data_assinatura)}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Protocolo */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Protocolo</CardTitle>
            {!protocolo && <Button size="sm" onClick={() => setModalProtocolo(true)}><Plus size={14} /> Registrar</Button>}
          </CardHeader>
          <CardContent>
            {!protocolo ? (
              <p className="text-sm text-gray-400">Protocolo ainda não registrado.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div><p className="text-xs text-gray-500">Modalidade</p><p className="text-sm font-medium">{protocolo.modalidade}</p></div>
                <div><p className="text-xs text-gray-500">Data</p><p className="text-sm font-medium">{formatarData(protocolo.data)}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><Badge className="bg-green-100 text-green-700">{protocolo.status}</Badge></div>
                {protocolo.numero_sei && <div><p className="text-xs text-gray-500">N° SEI</p><p className="text-sm font-mono">{protocolo.numero_sei}</p></div>}
                {protocolo.comprovante_link && <div><p className="text-xs text-gray-500">Comprovante</p><a href={protocolo.comprovante_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink size={12} />Abrir</a></div>}
                {protocolo.manifestacao_assinada_link && <div><p className="text-xs text-gray-500">Manifestação assinada</p><a href={protocolo.manifestacao_assinada_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink size={12} />Abrir</a></div>}
                {protocolo.documentos_protocolados && <div className="col-span-2"><p className="text-xs text-gray-500">Documentos protocolados</p><p className="text-sm text-gray-800 mt-0.5">{protocolo.documentos_protocolados}</p></div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAIS */}
      <Modal open={modalAndamento} onClose={() => setModalAndamento(false)} title="Registrar andamento" size="md">
        <form onSubmit={salvarAndamento} className="flex flex-col gap-4">
          <Textarea id="descricao_and" label="Descrição" value={novoAndamento.descricao} onChange={(e) => setNovoAndamento({ ...novoAndamento, descricao: e.target.value })} required rows={4} />
          <Select id="vis_and" label="Visibilidade" value={novoAndamento.visibilidade} onChange={(e) => setNovoAndamento({ ...novoAndamento, visibilidade: e.target.value as Visibilidade })} options={[{ value: 'Interno', label: 'Interno (escritório)' }, { value: 'Cliente', label: 'Visível à IES' }]} required />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalAndamento(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalPendencia} onClose={() => setModalPendencia(false)} title="Nova pendência documental" size="md">
        <form onSubmit={salvarPendencia} className="flex flex-col gap-4">
          <Input id="doc_sol" label="Documento/informação solicitada" value={novaPendencia.documento_solicitado} onChange={(e) => setNovaPendencia({ ...novaPendencia, documento_solicitado: e.target.value })} required />
          <Textarea id="instrucao" label="Instrução objetiva para a IES" value={novaPendencia.instrucao} onChange={(e) => setNovaPendencia({ ...novaPendencia, instrucao: e.target.value })} />
          <Input id="resp_ies" label="Responsável na IES" value={novaPendencia.responsavel_ies} onChange={(e) => setNovaPendencia({ ...novaPendencia, responsavel_ies: e.target.value })} />
          <Input id="prazo_ies" label="Prazo de envio pela IES" type="date" value={novaPendencia.prazo_envio} onChange={(e) => setNovaPendencia({ ...novaPendencia, prazo_envio: e.target.value })} />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalPendencia(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Criar pendência'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalDocumento} onClose={() => setModalDocumento(false)} title="Registrar documento" size="md">
        <form onSubmit={salvarDocumento} className="flex flex-col gap-4">
          <Input id="nome_doc" label="Nome do documento" value={novoDocumento.nome} onChange={(e) => setNovoDocumento({ ...novoDocumento, nome: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input id="tipo_doc" label="Tipo" value={novoDocumento.tipo} onChange={(e) => setNovoDocumento({ ...novoDocumento, tipo: e.target.value })} placeholder="Ex: Ata, Contrato…" required />
            <Input id="origem_doc" label="Origem" value={novoDocumento.origem} onChange={(e) => setNovoDocumento({ ...novoDocumento, origem: e.target.value })} required />
          </div>
          <Input id="link_doc" label="Link/caminho (Google Drive, Nextcloud…)" value={novoDocumento.local_link} onChange={(e) => setNovoDocumento({ ...novoDocumento, local_link: e.target.value })} required />
          <Select id="vis_doc" label="Visibilidade" value={novoDocumento.visibilidade} onChange={(e) => setNovoDocumento({ ...novoDocumento, visibilidade: e.target.value as Visibilidade })} options={[{ value: 'Interno', label: 'Interno' }, { value: 'Cliente', label: 'Visível à IES' }]} required />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalDocumento(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalManifestacao} onClose={() => setModalManifestacao(false)} title="Nova manifestação" size="md">
        <form onSubmit={salvarManifestacao} className="flex flex-col gap-4">
          <Input id="versao_man" label="Versão" type="number" value={novaManifestacao.versao} onChange={(e) => setNovaManifestacao({ ...novaManifestacao, versao: Number(e.target.value) })} required />
          <Select id="status_man" label="Status" value={novaManifestacao.status} onChange={(e) => setNovaManifestacao({ ...novaManifestacao, status: e.target.value as StatusManifestacao })} options={STATUS_MANIFESTACAO_LISTA.map(s => ({ value: s, label: s }))} required />
          <Input id="limite_ass" label="Prazo de assinatura (IES)" type="date" value={novaManifestacao.data_limite_assinatura} onChange={(e) => setNovaManifestacao({ ...novaManifestacao, data_limite_assinatura: e.target.value })} />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalManifestacao(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalProtocolo} onClose={() => setModalProtocolo(false)} title="Registrar protocolo" size="md">
        <form onSubmit={salvarProtocolo} className="flex flex-col gap-4">
          <Select id="modal_prot" label="Modalidade" value={novoProtocolo.modalidade} onChange={(e) => setNovoProtocolo({ ...novoProtocolo, modalidade: e.target.value as 'Eletrônico' | 'Presencial' })} options={[{ value: 'Eletrônico', label: 'Eletrônico' }, { value: 'Presencial', label: 'Presencial' }]} required />
          <Input id="data_prot" label="Data do protocolo" type="date" value={novoProtocolo.data} onChange={(e) => setNovoProtocolo({ ...novoProtocolo, data: e.target.value })} required />
          <Input id="comp_prot" label="Link do comprovante" value={novoProtocolo.comprovante_link} onChange={(e) => setNovoProtocolo({ ...novoProtocolo, comprovante_link: e.target.value })} required={novoProtocolo.modalidade === 'Eletrônico'} />
          <Input id="sei_prot" label="Número/identificação SEI" value={novoProtocolo.numero_sei} onChange={(e) => setNovoProtocolo({ ...novoProtocolo, numero_sei: e.target.value })} required={novoProtocolo.modalidade === 'Eletrônico'} />
          <Input id="man_prot" label="Link da manifestação assinada" value={novoProtocolo.manifestacao_assinada_link} onChange={(e) => setNovoProtocolo({ ...novoProtocolo, manifestacao_assinada_link: e.target.value })} required={novoProtocolo.modalidade === 'Eletrônico'} />
          <Textarea id="docs_prot" label="Documentos protocolados (identificação)" value={novoProtocolo.documentos_protocolados} onChange={(e) => setNovoProtocolo({ ...novoProtocolo, documentos_protocolados: e.target.value })} />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalProtocolo(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Registrar protocolo'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalStatus} onClose={() => setModalStatus(false)} title="Alterar status do processo" size="sm">
        <form onSubmit={atualizarStatus} className="flex flex-col gap-4">
          <Select id="new_status" label="Novo status" value={novoStatus} onChange={(e) => setNovoStatus(e.target.value as StatusProcesso)} options={STATUS_PROCESSO_LISTA.map(s => ({ value: s, label: s }))} required />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalStatus(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Confirmar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
