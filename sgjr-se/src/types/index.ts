export type PerfilUsuario =
  | 'administrador'
  | 'advogada_responsavel'
  | 'advogado_revisor'
  | 'assistente'
  | 'ies_interlocutor'
  | 'ies_representante_legal'

export type StatusProcesso =
  | 'Recebido'
  | 'Cadastrado'
  | 'Em análise inicial'
  | 'Aguardando documentos da IES'
  | 'Documentação recebida'
  | 'Documentação incompleta'
  | 'Em elaboração'
  | 'Em revisão formal'
  | 'Em aprovação jurídica'
  | 'Aguardando assinatura'
  | 'Aguardando protocolo'
  | 'Protocolado'
  | 'Em acompanhamento'
  | 'Arquivado'

export type NivelRisco = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
export type StatusPrazo = 'Pendente' | 'Em andamento' | 'Cumprido' | 'Vencido'
export type StatusPendencia = 'Pendente' | 'Enviado pela IES' | 'Em validação' | 'Validado' | 'Devolvido para correção'
export type StatusDocumento = 'Recebido' | 'Em validação' | 'Validado' | 'Rejeitado' | 'Arquivado'
export type StatusManifestacao =
  | 'Em elaboração'
  | 'Em revisão formal'
  | 'Em aprovação jurídica'
  | 'Aprovada'
  | 'Enviada para assinatura'
  | 'Assinada'
  | 'Protocolada'
export type ModalidadeProtocolo = 'Presencial' | 'Eletrônico'
export type StatusProtocolo = 'Pendente' | 'Registrado' | 'Comprovado'
export type Visibilidade = 'Interno' | 'Cliente'
export type TipoPrazo = 'Externo' | 'Interno'

export interface Perfil {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface IES {
  id: string
  nome: string
  cnpj: string
  mantenedora: string | null
  representante_legal: string
  email_representante: string
  procurador_institucional: string | null
  diretoria_academica: string | null
  ativa: boolean
  criado_em: string
  atualizado_em: string
}

export interface ContatoIES {
  id: string
  ies_id: string
  usuario_id: string | null
  nome: string
  email: string
  cargo: string | null
  autorizado: boolean
  criado_em: string
}

export interface Processo {
  id: string
  id_interno: string
  ies_id: string
  numero_sei: string | null
  numero_emec: string | null
  tipo_comunicacao: string
  data_ciencia: string
  prazo_externo: string
  prazo_interno: string
  assunto: string
  curso: string | null
  polo: string | null
  status: StatusProcesso
  risco: NivelRisco
  responsavel_id: string | null
  responsavel_em: string | null
  observacoes_internas: string | null
  criado_em: string
  atualizado_em: string
  ies?: IES
  responsavel?: Perfil
}

export interface Prazo {
  id: string
  processo_id: string
  tipo: TipoPrazo
  data_inicial: string
  data_final: string
  responsavel_id: string | null
  status: StatusPrazo
  alerta_dias: number
  observacoes: string | null
  criado_em: string
  atualizado_em: string
  responsavel?: Perfil
}

export interface Andamento {
  id: string
  processo_id: string
  data: string
  descricao: string
  responsavel_id: string | null
  visibilidade: Visibilidade
  documento_id: string | null
  criado_em: string
  responsavel?: Perfil
}

export interface PendenciaDocumental {
  id: string
  processo_id: string
  documento_solicitado: string
  instrucao: string | null
  responsavel_ies: string | null
  prazo_envio: string | null
  status: StatusPendencia
  data_recebimento: string | null
  validado_em: string | null
  validado_por: string | null
  observacoes_escritorio: string | null
  observacoes_ies: string | null
  iteracao: number
  criado_em: string
  atualizado_em: string
}

export interface Documento {
  id: string
  processo_id: string
  pendencia_id: string | null
  nome: string
  tipo: string
  origem: string
  versao: number
  data: string
  responsavel_id: string | null
  local_link: string
  visibilidade: Visibilidade
  status: StatusDocumento
  criado_em: string
  atualizado_em: string
  responsavel?: Perfil
}

export interface Manifestacao {
  id: string
  processo_id: string
  versao: number
  data: string
  elaboradora_id: string | null
  status: StatusManifestacao
  data_revisao_formal: string | null
  revisora_id: string | null
  data_aprovacao_juridica: string | null
  aprovador_id: string | null
  data_envio_assinatura: string | null
  data_limite_assinatura: string | null
  data_assinatura: string | null
  documento_id: string | null
  criado_em: string
  atualizado_em: string
}

export interface Protocolo {
  id: string
  processo_id: string
  modalidade: ModalidadeProtocolo
  responsavel_id: string | null
  data: string
  comprovante_link: string | null
  numero_sei: string | null
  manifestacao_assinada_link: string | null
  documentos_protocolados: string | null
  status: StatusProtocolo
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface Risco {
  id: string
  processo_id: string
  categoria: string
  impacto: string
  probabilidade: string
  prioridade: NivelRisco
  tratamento_proposto: string | null
  status: string
  criado_em: string
  atualizado_em: string
}

export interface LogAuditoria {
  id: string
  usuario_id: string | null
  acao: string
  entidade: string
  entidade_id: string | null
  descricao: string | null
  criado_em: string
}

// Auxiliares para UI
export const STATUS_PROCESSO_LISTA: StatusProcesso[] = [
  'Recebido',
  'Cadastrado',
  'Em análise inicial',
  'Aguardando documentos da IES',
  'Documentação recebida',
  'Documentação incompleta',
  'Em elaboração',
  'Em revisão formal',
  'Em aprovação jurídica',
  'Aguardando assinatura',
  'Aguardando protocolo',
  'Protocolado',
  'Em acompanhamento',
  'Arquivado',
]

export const NIVEL_RISCO_LISTA: NivelRisco[] = ['Baixo', 'Médio', 'Alto', 'Crítico']

export const STATUS_PENDENCIA_LISTA: StatusPendencia[] = [
  'Pendente',
  'Enviado pela IES',
  'Em validação',
  'Validado',
  'Devolvido para correção',
]

export const STATUS_MANIFESTACAO_LISTA: StatusManifestacao[] = [
  'Em elaboração',
  'Em revisão formal',
  'Em aprovação jurídica',
  'Aprovada',
  'Enviada para assinatura',
  'Assinada',
  'Protocolada',
]

export const PERFIS_ESCRITORIO: PerfilUsuario[] = [
  'administrador',
  'advogada_responsavel',
  'advogado_revisor',
  'assistente',
]

export const PERFIS_IES: PerfilUsuario[] = ['ies_interlocutor', 'ies_representante_legal']
