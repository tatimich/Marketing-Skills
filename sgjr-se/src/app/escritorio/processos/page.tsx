'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { corStatus, corRisco, formatarData, diasRestantes, corPrazo, labelPrazo } from '@/lib/utils'
import { Plus, Search, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import type { Processo, IES, Perfil, StatusProcesso, NivelRisco } from '@/types'
import { STATUS_PROCESSO_LISTA, NIVEL_RISCO_LISTA } from '@/types'

export default function ProcessosPage() {
  const supabase = createClient()
  const [processos, setProcessos] = useState<(Processo & { ies: IES | null })[]>([])
  const [iesList, setIesList] = useState<IES[]>([])
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    ies_id: '',
    numero_sei: '',
    numero_emec: '',
    tipo_comunicacao: '',
    data_ciencia: '',
    prazo_externo: '',
    prazo_interno: '',
    assunto: '',
    curso: '',
    polo: '',
    status: 'Recebido' as StatusProcesso,
    risco: 'Médio' as NivelRisco,
    responsavel_id: '',
    responsavel_em: '',
    observacoes_internas: '',
  })

  async function carregar() {
    const { data } = await supabase
      .from('processos')
      .select('*, ies(id, nome, cnpj)')
      .order('prazo_externo', { ascending: true })
    setProcessos((data as any) ?? [])
  }

  async function carregarAuxiliares() {
    const [{ data: ies }, { data: users }] = await Promise.all([
      supabase.from('ies').select('*').eq('ativa', true).order('nome'),
      supabase.from('perfis').select('*').in('perfil', ['advogada_responsavel', 'assistente']).eq('ativo', true),
    ])
    setIesList(ies ?? [])
    setUsuarios(users ?? [])
  }

  useEffect(() => {
    carregar()
    carregarAuxiliares()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const payload = {
      ies_id: form.ies_id,
      numero_sei: form.numero_sei || null,
      numero_emec: form.numero_emec || null,
      tipo_comunicacao: form.tipo_comunicacao,
      data_ciencia: form.data_ciencia,
      prazo_externo: form.prazo_externo,
      prazo_interno: form.prazo_interno,
      assunto: form.assunto,
      curso: form.curso || null,
      polo: form.polo || null,
      status: form.status,
      risco: form.risco,
      responsavel_id: form.responsavel_id || null,
      responsavel_em: form.responsavel_em || null,
      observacoes_internas: form.observacoes_internas || null,
    }
    await supabase.from('processos').insert(payload)
    setSalvando(false)
    setModalAberto(false)
    carregar()
  }

  const listafiltrada = processos.filter((p) => {
    const q = filtro.toLowerCase()
    const matchQ = !q || p.id_interno.toLowerCase().includes(q) || p.assunto.toLowerCase().includes(q) || p.ies?.nome.toLowerCase().includes(q)
    const matchStatus = !filtroStatus || p.status === filtroStatus
    return matchQ && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-sm text-gray-500 mt-1">{processos.length} processo(s) no total</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus size={16} /> Novo processo
        </Button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm w-64 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Buscar por ID, assunto, IES…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-gray-300 text-sm px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_PROCESSO_LISTA.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">ID / IES</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Assunto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Risco</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Prazo ext.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listafiltrada.map((p) => {
              const dias = diasRestantes(p.prazo_externo)
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/escritorio/processos/${p.id}`} className="font-medium text-blue-700 hover:underline block">
                      {p.id_interno}
                    </Link>
                    <span className="text-xs text-gray-500">{p.ies?.nome}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <p className="truncate">{p.assunto}</p>
                    {p.curso && <span className="text-xs text-gray-400">{p.curso}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={corStatus(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={corRisco(p.risco)}>{p.risco}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600">{formatarData(p.prazo_externo)}</p>
                    <p className={`text-xs font-medium ${corPrazo(dias)}`}>{labelPrazo(dias)}</p>
                  </td>
                </tr>
              )
            })}
            {!listafiltrada.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  <FolderOpen size={32} className="mx-auto mb-2 text-gray-300" />
                  Nenhum processo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Novo Processo" size="xl">
        <form onSubmit={salvar} className="grid grid-cols-2 gap-4">
          <Select id="ies_id" label="IES" value={form.ies_id} onChange={(e) => setForm({ ...form, ies_id: e.target.value })} options={iesList.map((i) => ({ value: i.id, label: i.nome }))} placeholder="Selecione a IES" required className="col-span-2" />
          <Input id="tipo_comunicacao" label="Tipo de comunicação" value={form.tipo_comunicacao} onChange={(e) => setForm({ ...form, tipo_comunicacao: e.target.value })} placeholder="Ex: Ofício, Notificação…" required className="col-span-2" />
          <Input id="numero_sei" label="Número SEI" value={form.numero_sei} onChange={(e) => setForm({ ...form, numero_sei: e.target.value })} />
          <Input id="numero_emec" label="Número e-MEC" value={form.numero_emec} onChange={(e) => setForm({ ...form, numero_emec: e.target.value })} />
          <Input id="data_ciencia" label="Data de ciência" type="date" value={form.data_ciencia} onChange={(e) => setForm({ ...form, data_ciencia: e.target.value })} required />
          <Select id="status" label="Status inicial" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusProcesso })} options={STATUS_PROCESSO_LISTA.map((s) => ({ value: s, label: s }))} required />
          <Input id="prazo_externo" label="Prazo externo" type="date" value={form.prazo_externo} onChange={(e) => setForm({ ...form, prazo_externo: e.target.value })} required />
          <Input id="prazo_interno" label="Prazo interno" type="date" value={form.prazo_interno} onChange={(e) => setForm({ ...form, prazo_interno: e.target.value })} required />
          <Textarea id="assunto" label="Assunto" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} required className="col-span-2" rows={2} />
          <Input id="curso" label="Curso (se aplicável)" value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })} />
          <Input id="polo" label="Polo (se aplicável)" value={form.polo} onChange={(e) => setForm({ ...form, polo: e.target.value })} />
          <Select id="risco" label="Risco preliminar" value={form.risco} onChange={(e) => setForm({ ...form, risco: e.target.value as NivelRisco })} options={NIVEL_RISCO_LISTA.map((r) => ({ value: r, label: r }))} required />
          <Select id="responsavel_id" label="Responsável (escritório)" value={form.responsavel_id} onChange={(e) => setForm({ ...form, responsavel_id: e.target.value })} options={usuarios.map((u) => ({ value: u.id, label: u.nome }))} placeholder="Selecione" />
          <Textarea id="observacoes_internas" label="Observações internas" value={form.observacoes_internas} onChange={(e) => setForm({ ...form, observacoes_internas: e.target.value })} className="col-span-2" rows={2} />
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Cadastrar processo'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
