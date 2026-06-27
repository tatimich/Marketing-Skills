-- SGJR-SE: Schema Inicial – Fase 1
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE perfil_usuario AS ENUM (
  'administrador',
  'advogada_responsavel',
  'advogado_revisor',
  'assistente',
  'ies_interlocutor',
  'ies_representante_legal'
);

CREATE TYPE status_processo AS ENUM (
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
  'Arquivado'
);

CREATE TYPE nivel_risco AS ENUM ('Baixo', 'Médio', 'Alto', 'Crítico');

CREATE TYPE status_prazo AS ENUM ('Pendente', 'Em andamento', 'Cumprido', 'Vencido');

CREATE TYPE status_pendencia AS ENUM ('Pendente', 'Enviado pela IES', 'Em validação', 'Validado', 'Devolvido para correção');

CREATE TYPE status_documento AS ENUM ('Recebido', 'Em validação', 'Validado', 'Rejeitado', 'Arquivado');

CREATE TYPE status_manifestacao AS ENUM (
  'Em elaboração',
  'Em revisão formal',
  'Em aprovação jurídica',
  'Aprovada',
  'Enviada para assinatura',
  'Assinada',
  'Protocolada'
);

CREATE TYPE modalidade_protocolo AS ENUM ('Presencial', 'Eletrônico');

CREATE TYPE status_protocolo AS ENUM ('Pendente', 'Registrado', 'Comprovado');

CREATE TYPE visibilidade AS ENUM ('Interno', 'Cliente');

CREATE TYPE tipo_prazo AS ENUM ('Externo', 'Interno');

-- ============================================================
-- TABELA: perfis (extensão do auth.users do Supabase)
-- ============================================================

CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil perfil_usuario NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ies
-- ============================================================

CREATE TABLE ies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  mantenedora TEXT,
  representante_legal TEXT NOT NULL,
  email_representante TEXT NOT NULL,
  procurador_institucional TEXT,
  diretoria_academica TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: contatos_ies
-- ============================================================

CREATE TABLE contatos_ies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ies_id UUID NOT NULL REFERENCES ies(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT,
  autorizado BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: processos
-- ============================================================

CREATE SEQUENCE processo_seq START 1;

CREATE TABLE processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_interno TEXT NOT NULL UNIQUE DEFAULT 'SGJR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('processo_seq')::TEXT, 4, '0'),
  ies_id UUID NOT NULL REFERENCES ies(id),
  numero_sei TEXT,
  numero_emec TEXT,
  tipo_comunicacao TEXT NOT NULL,
  data_ciencia DATE NOT NULL,
  prazo_externo DATE NOT NULL,
  prazo_interno DATE NOT NULL,
  assunto TEXT NOT NULL,
  curso TEXT,
  polo TEXT,
  status status_processo NOT NULL DEFAULT 'Recebido',
  risco nivel_risco DEFAULT 'Médio',
  responsavel_id UUID REFERENCES perfis(id),
  responsavel_em TEXT,
  observacoes_internas TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: prazos
-- ============================================================

CREATE TABLE prazos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  tipo tipo_prazo NOT NULL,
  data_inicial DATE NOT NULL,
  data_final DATE NOT NULL,
  responsavel_id UUID REFERENCES perfis(id),
  status status_prazo DEFAULT 'Pendente',
  alerta_dias INTEGER DEFAULT 5,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: andamentos
-- ============================================================

CREATE TABLE andamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  data TIMESTAMPTZ DEFAULT NOW(),
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES perfis(id),
  visibilidade visibilidade DEFAULT 'Interno',
  documento_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: pendencias_documentais
-- ============================================================

CREATE TABLE pendencias_documentais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  documento_solicitado TEXT NOT NULL,
  instrucao TEXT,
  responsavel_ies TEXT,
  prazo_envio DATE,
  status status_pendencia DEFAULT 'Pendente',
  data_recebimento DATE,
  validado_em TIMESTAMPTZ,
  validado_por UUID REFERENCES perfis(id),
  observacoes_escritorio TEXT,
  observacoes_ies TEXT,
  iteracao INTEGER DEFAULT 1,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: documentos
-- ============================================================

CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  pendencia_id UUID REFERENCES pendencias_documentais(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  origem TEXT NOT NULL,
  versao INTEGER DEFAULT 1,
  data DATE DEFAULT CURRENT_DATE,
  responsavel_id UUID REFERENCES perfis(id),
  local_link TEXT NOT NULL,
  visibilidade visibilidade DEFAULT 'Interno',
  status status_documento DEFAULT 'Recebido',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Referência circular: andamentos -> documentos
ALTER TABLE andamentos ADD CONSTRAINT fk_andamento_documento
  FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE SET NULL;

-- ============================================================
-- TABELA: manifestacoes
-- ============================================================

CREATE TABLE manifestacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  versao INTEGER DEFAULT 1,
  data DATE DEFAULT CURRENT_DATE,
  elaboradora_id UUID REFERENCES perfis(id),
  status status_manifestacao DEFAULT 'Em elaboração',
  data_revisao_formal DATE,
  revisora_id UUID REFERENCES perfis(id),
  data_aprovacao_juridica DATE,
  aprovador_id UUID REFERENCES perfis(id),
  data_envio_assinatura DATE,
  data_limite_assinatura DATE,
  data_assinatura DATE,
  documento_id UUID REFERENCES documentos(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: protocolos
-- ============================================================

CREATE TABLE protocolos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  modalidade modalidade_protocolo NOT NULL,
  responsavel_id UUID REFERENCES perfis(id),
  data DATE NOT NULL,
  comprovante_link TEXT,
  numero_sei TEXT,
  manifestacao_assinada_link TEXT,
  documentos_protocolados TEXT,
  status status_protocolo DEFAULT 'Pendente',
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: riscos
-- ============================================================

CREATE TABLE riscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  impacto TEXT NOT NULL,
  probabilidade TEXT NOT NULL,
  prioridade nivel_risco DEFAULT 'Médio',
  tratamento_proposto TEXT,
  status TEXT DEFAULT 'Identificado',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: log_auditoria
-- ============================================================

CREATE TABLE log_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_processos_ies ON processos(ies_id);
CREATE INDEX idx_processos_status ON processos(status);
CREATE INDEX idx_processos_prazo_externo ON processos(prazo_externo);
CREATE INDEX idx_prazos_processo ON prazos(processo_id);
CREATE INDEX idx_prazos_data_final ON prazos(data_final);
CREATE INDEX idx_andamentos_processo ON andamentos(processo_id);
CREATE INDEX idx_pendencias_processo ON pendencias_documentais(processo_id);
CREATE INDEX idx_documentos_processo ON documentos(processo_id);
CREATE INDEX idx_manifestacoes_processo ON manifestacoes(processo_id);
CREATE INDEX idx_protocolos_processo ON protocolos(processo_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE ies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_ies ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE andamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias_documentais ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE riscos ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna perfil do usuário autenticado
CREATE OR REPLACE FUNCTION auth_perfil()
RETURNS perfil_usuario AS $$
  SELECT perfil FROM perfis WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Função auxiliar: retorna IES vinculadas ao usuário (para perfil IES)
CREATE OR REPLACE FUNCTION auth_ies_ids()
RETURNS SETOF UUID AS $$
  SELECT ies_id FROM contatos_ies WHERE usuario_id = auth.uid() AND autorizado = TRUE;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Escritório: acesso total
CREATE POLICY "Escritório acessa tudo" ON ies
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

-- IES: vê apenas sua própria IES
CREATE POLICY "IES acessa própria IES" ON ies
  FOR SELECT USING (id IN (SELECT auth_ies_ids()));

-- Processos: escritório vê tudo; IES vê apenas seus processos
CREATE POLICY "Escritório acessa processos" ON processos
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

CREATE POLICY "IES acessa próprios processos" ON processos
  FOR SELECT USING (ies_id IN (SELECT auth_ies_ids()));

-- Andamentos: escritório vê todos; IES vê apenas os visíveis ao cliente
CREATE POLICY "Escritório acessa andamentos" ON andamentos
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

CREATE POLICY "IES acessa andamentos visíveis" ON andamentos
  FOR SELECT USING (
    visibilidade = 'Cliente'
    AND processo_id IN (SELECT id FROM processos WHERE ies_id IN (SELECT auth_ies_ids()))
  );

-- Pendências: escritório CRUD; IES lê + atualiza observações
CREATE POLICY "Escritório acessa pendências" ON pendencias_documentais
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

CREATE POLICY "IES acessa pendências" ON pendencias_documentais
  FOR SELECT USING (
    processo_id IN (SELECT id FROM processos WHERE ies_id IN (SELECT auth_ies_ids()))
  );

-- Documentos: escritório vê tudo; IES vê apenas docs visíveis ao cliente
CREATE POLICY "Escritório acessa documentos" ON documentos
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

CREATE POLICY "IES acessa documentos visíveis" ON documentos
  FOR SELECT USING (
    visibilidade = 'Cliente'
    AND processo_id IN (SELECT id FROM processos WHERE ies_id IN (SELECT auth_ies_ids()))
  );

-- Manifestações: apenas escritório
CREATE POLICY "Escritório acessa manifestações" ON manifestacoes
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

-- Protocolos: escritório CRUD; IES vê
CREATE POLICY "Escritório acessa protocolos" ON protocolos
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

CREATE POLICY "IES acessa protocolos" ON protocolos
  FOR SELECT USING (
    processo_id IN (SELECT id FROM processos WHERE ies_id IN (SELECT auth_ies_ids()))
  );

-- Prazos: escritório CRUD; IES lê
CREATE POLICY "Escritório acessa prazos" ON prazos
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

CREATE POLICY "IES acessa prazos" ON prazos
  FOR SELECT USING (
    processo_id IN (SELECT id FROM processos WHERE ies_id IN (SELECT auth_ies_ids()))
  );

-- Riscos: apenas escritório
CREATE POLICY "Escritório acessa riscos" ON riscos
  FOR ALL USING (auth_perfil() IN ('administrador','advogada_responsavel','advogado_revisor','assistente'));

-- Log de auditoria: apenas administrador e advogada
CREATE POLICY "Gestão acessa log" ON log_auditoria
  FOR SELECT USING (auth_perfil() IN ('administrador','advogada_responsavel'));

-- Perfis: cada usuário vê o próprio; escritório vê todos
CREATE POLICY "Perfil próprio" ON perfis
  FOR SELECT USING (id = auth.uid() OR auth_perfil() IN ('administrador','advogada_responsavel'));

CREATE POLICY "Admin atualiza perfis" ON perfis
  FOR ALL USING (auth_perfil() = 'administrador');

-- ============================================================
-- TRIGGER: atualizar updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ies_updated BEFORE UPDATE ON ies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_processos_updated BEFORE UPDATE ON processos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prazos_updated BEFORE UPDATE ON prazos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pendencias_updated BEFORE UPDATE ON pendencias_documentais FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_documentos_updated BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_manifestacoes_updated BEFORE UPDATE ON manifestacoes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_protocolos_updated BEFORE UPDATE ON protocolos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_riscos_updated BEFORE UPDATE ON riscos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_perfis_updated BEFORE UPDATE ON perfis FOR EACH ROW EXECUTE FUNCTION set_updated_at();
