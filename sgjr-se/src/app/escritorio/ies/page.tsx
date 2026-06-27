'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { formatarCNPJ } from '@/lib/utils'
import { Plus, Search, Building2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import type { IES } from '@/types'

export default function IESPage() {
  const supabase = createClient()
  const [lista, setLista] = useState<IES[]>([])
  const [filtro, setFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<IES | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    mantenedora: '',
    representante_legal: '',
    email_representante: '',
    procurador_institucional: '',
    diretoria_academica: '',
  })

  async function carregar() {
    const { data } = await supabase.from('ies').select('*').order('nome')
    setLista(data ?? [])
  }

  useEffect(() => { carregar() }, [])

  function abrirNova() {
    setEditando(null)
    setForm({ nome: '', cnpj: '', mantenedora: '', representante_legal: '', email_representante: '', procurador_institucional: '', diretoria_academica: '' })
    setModalAberto(true)
  }

  function abrirEdicao(ies: IES) {
    setEditando(ies)
    setForm({
      nome: ies.nome,
      cnpj: ies.cnpj,
      mantenedora: ies.mantenedora ?? '',
      representante_legal: ies.representante_legal,
      email_representante: ies.email_representante,
      procurador_institucional: ies.procurador_institucional ?? '',
      diretoria_academica: ies.diretoria_academica ?? '',
    })
    setModalAberto(true)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const payload = {
      nome: form.nome,
      cnpj: form.cnpj.replace(/\D/g, ''),
      mantenedora: form.mantenedora || null,
      representante_legal: form.representante_legal,
      email_representante: form.email_representante,
      procurador_institucional: form.procurador_institucional || null,
      diretoria_academica: form.diretoria_academica || null,
    }

    if (editando) {
      await supabase.from('ies').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('ies').insert(payload)
    }

    setSalvando(false)
    setModalAberto(false)
    carregar()
  }

  const listaFiltrada = lista.filter(
    (ies) =>
      ies.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      ies.cnpj.includes(filtro.replace(/\D/g, ''))
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instituições de Ensino Superior</h1>
          <p className="text-sm text-gray-500 mt-1">{lista.length} instituição(ões) cadastrada(s)</p>
        </div>
        <Button onClick={abrirNova}>
          <Plus size={16} />
          Nova IES
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full max-w-sm pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Buscar por nome ou CNPJ…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {listaFiltrada.map((ies) => (
          <Card key={ies.id} className="hover:border-blue-300 transition-colors">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <Building2 size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <Link
                    href={`/escritorio/ies/${ies.id}`}
                    className="text-sm font-semibold text-blue-700 hover:underline leading-tight"
                  >
                    {ies.nome}
                  </Link>
                </div>
                <button
                  onClick={() => abrirEdicao(ies)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-1">CNPJ: {formatarCNPJ(ies.cnpj)}</p>
              {ies.mantenedora && (
                <p className="text-xs text-gray-500 mb-1">Mantenedora: {ies.mantenedora}</p>
              )}
              <p className="text-xs text-gray-600">Rep. Legal: {ies.representante_legal}</p>
              <div className="mt-2">
                <Badge className={ies.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {ies.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {!listaFiltrada.length && (
          <p className="text-sm text-gray-500 col-span-3 py-8 text-center">
            {filtro ? 'Nenhuma IES encontrada.' : 'Nenhuma IES cadastrada ainda.'}
          </p>
        )}
      </div>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar IES' : 'Nova Instituição de Ensino Superior'}
        size="lg"
      >
        <form onSubmit={salvar} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="nome" label="Nome da IES" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="col-span-2" />
            <Input id="cnpj" label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" required />
            <Input id="mantenedora" label="Mantenedora" value={form.mantenedora} onChange={(e) => setForm({ ...form, mantenedora: e.target.value })} />
            <Input id="representante_legal" label="Representante Legal" value={form.representante_legal} onChange={(e) => setForm({ ...form, representante_legal: e.target.value })} required />
            <Input id="email_representante" label="E-mail do Representante" type="email" value={form.email_representante} onChange={(e) => setForm({ ...form, email_representante: e.target.value })} required />
            <Input id="procurador_institucional" label="Procurador Institucional" value={form.procurador_institucional} onChange={(e) => setForm({ ...form, procurador_institucional: e.target.value })} />
            <Input id="diretoria_academica" label="Diretoria Acadêmica" value={form.diretoria_academica} onChange={(e) => setForm({ ...form, diretoria_academica: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
