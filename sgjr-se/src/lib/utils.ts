import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { NivelRisco, StatusProcesso, StatusPendencia, StatusManifestacao } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return '—'
  try {
    return format(parseISO(data), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return data
  }
}

export function formatarDataHora(data: string | null | undefined): string {
  if (!data) return '—'
  try {
    return format(parseISO(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return data
  }
}

export function diasRestantes(dataFinal: string): number {
  return differenceInDays(parseISO(dataFinal), new Date())
}

export function corRisco(risco: NivelRisco): string {
  const cores: Record<NivelRisco, string> = {
    Baixo: 'bg-green-100 text-green-800',
    Médio: 'bg-yellow-100 text-yellow-800',
    Alto: 'bg-orange-100 text-orange-800',
    Crítico: 'bg-red-100 text-red-800',
  }
  return cores[risco]
}

export function corStatus(status: StatusProcesso): string {
  const mapa: Partial<Record<StatusProcesso, string>> = {
    'Recebido': 'bg-slate-100 text-slate-700',
    'Cadastrado': 'bg-blue-100 text-blue-700',
    'Em análise inicial': 'bg-blue-100 text-blue-700',
    'Aguardando documentos da IES': 'bg-amber-100 text-amber-700',
    'Documentação recebida': 'bg-teal-100 text-teal-700',
    'Documentação incompleta': 'bg-orange-100 text-orange-700',
    'Em elaboração': 'bg-indigo-100 text-indigo-700',
    'Em revisão formal': 'bg-purple-100 text-purple-700',
    'Em aprovação jurídica': 'bg-violet-100 text-violet-700',
    'Aguardando assinatura': 'bg-yellow-100 text-yellow-700',
    'Aguardando protocolo': 'bg-amber-100 text-amber-800',
    'Protocolado': 'bg-green-100 text-green-700',
    'Em acompanhamento': 'bg-cyan-100 text-cyan-700',
    'Arquivado': 'bg-gray-100 text-gray-600',
  }
  return mapa[status] ?? 'bg-gray-100 text-gray-600'
}

export function corPendencia(status: StatusPendencia): string {
  const mapa: Record<StatusPendencia, string> = {
    'Pendente': 'bg-red-100 text-red-700',
    'Enviado pela IES': 'bg-blue-100 text-blue-700',
    'Em validação': 'bg-yellow-100 text-yellow-700',
    'Validado': 'bg-green-100 text-green-700',
    'Devolvido para correção': 'bg-orange-100 text-orange-700',
  }
  return mapa[status]
}

export function corPrazo(diasRestantes: number): string {
  if (diasRestantes < 0) return 'text-red-600 font-semibold'
  if (diasRestantes <= 3) return 'text-red-500 font-medium'
  if (diasRestantes <= 7) return 'text-amber-600 font-medium'
  return 'text-green-700'
}

export function labelPrazo(dias: number): string {
  if (dias < 0) return `Vencido há ${Math.abs(dias)} dia(s)`
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return 'Vence amanhã'
  return `${dias} dia(s)`
}

export function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function isPerfilEscritorio(perfil: string): boolean {
  return ['administrador', 'advogada_responsavel', 'advogado_revisor', 'assistente'].includes(perfil)
}
