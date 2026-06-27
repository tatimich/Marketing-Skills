# SGJR-SE – Guia de Instalação (Fase 1)

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita para hospedagem)

---

## 1. Configurar o Supabase

1. Crie um novo projeto em [app.supabase.com](https://app.supabase.com)
2. Vá em **SQL Editor** e execute o arquivo:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon public key`

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com os valores do Supabase.

---

## 3. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 4. Criar usuários

No painel do Supabase, vá em **Authentication → Users → Invite user**.

Depois de criado o usuário via Auth, insira o perfil na tabela `perfis`:

```sql
INSERT INTO perfis (id, nome, email, perfil)
VALUES (
  '<uuid-do-usuario-auth>',
  'Tatiane Michelin',
  'tatiane@escritorio.com',
  'advogada_responsavel'
);
```

Perfis disponíveis:
- `administrador`
- `advogada_responsavel`
- `advogado_revisor`
- `assistente`
- `ies_interlocutor`
- `ies_representante_legal`

Para usuários de IES, além do perfil, cadastrar em `contatos_ies` vinculando `usuario_id` à IES correspondente.

---

## 5. Deploy no Vercel

```bash
npx vercel --prod
```

Adicionar as variáveis de ambiente no painel do Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Estrutura de pastas recomendada no Google Drive

```
AAAA / IES / Processo_[ID_SGJR]_[SEI] /
  01_Notificacao_e_Comunicacoes/
  02_Documentos_IES/
  03_Evidencias_Digitais/
  04_Minutas/
  05_Revisao_Aprovacao/
  06_Assinatura/
  07_Protocolo/
  08_Decisao_Andamentos/
  09_Arquivamento/
```

Nomenclatura de arquivos:
```
AAAA-MM-DD_TipoDocumento_IES_Processo_Versao_Responsavel.ext
```

---

## Custo estimado (Fase 1)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Supabase | Free (500MB DB, 1GB storage) | R$ 0/mês |
| Vercel | Hobby | R$ 0/mês |
| Google Drive | Já existente | R$ 0/mês |

**Total: R$ 0/mês** até escalar para múltiplos escritórios ou volumes maiores.
