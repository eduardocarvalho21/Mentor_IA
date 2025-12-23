# MentorIA - Local RAG System with Strict Validation

O **MentorIA** é um assistente inteligente baseado em arquitetura **RAG (Retrieval-Augmented Generation)** que roda 100% localmente. O projeto foi desenhado para analisar documentos técnicos e responder perguntas com **zero custo de API**, privacidade total e, principalmente, **mecanismos robustos contra alucinação**.

---

## 🚀 Diferenciais de Engenharia

Diferente de wrappers simples de IA, o MentorIA implementa lógicas avançadas de backend:

- **🛡️ Guardrails Anti-Alucinação:** Utiliza um algoritmo de *Cosine Similarity* com threshold rigoroso (`0.50`). Se a pergunta foge do contexto do documento (ex: perguntar de futebol em um texto médico), o sistema bloqueia a resposta antes mesmo de chamar a LLM.
- **❄️ Tratamento de Cold Start:** Implementação de um padrão de **Retry com Backoff Exponencial**. Se o modelo local (Ollama) estiver descarregado da RAM, o backend aguarda e retenta a conexão automaticamente, evitando erros para o usuário.
- **⚡ Busca Vetorial Otimizada:** Utiliza índices **HNSW** (Hierarchical Navigable Small World) no PostgreSQL, permitindo buscas semânticas em milissegundos.
- **💬 Streaming em Tempo Real:** Respostas geradas token a token para uma UX fluida.

---

## 🛠️ Tech Stack

### Core
- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), Tailwind CSS.
- **Backend:** Next.js Server Actions & API Routes.
- **Linguagem:** TypeScript.

### Dados & IA
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + `pgvector`).
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/).
- **AI Engine (Local):** [Ollama](https://ollama.com/).
- **Modelos:**
  - LLM: `llama3.2:1b` (Geração de texto rápida e leve).
  - Embeddings: `nomic-embed-text` (Vetorização de alta fidelidade).

### Ingestão
- **Scripts:** Python (para processamento de PDFs e *chunking*).

---

# Baixe os modelos necessários

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text

```bash
-- Habilitar pgvector
create extension vector;

-- Tabela de Embeddings (exemplo simplificado)
create table embeddings (
  id serial primary key,
  content text not null,
  embedding vector(768) -- Ajuste conforme o modelo nomic
);

--  Índice HNSW para performance extrema
create index on embeddings using hnsw (embedding vector_cosine_ops);

```bash
git clone https://github.com/eduardocarvalho21/Mentor_IA.git
cd mentoria
npm install

```bash
DATABASE_URL=postgres://user:pass@host:5432/db
NEXT_PUBLIC_API_URL=http://localhost:3000

```bash
npm run dev

Acesse **http://localhost:3000.**

Como Funciona o "Cérebro" (Fluxo RAG)
Input: O usuário faz uma pergunta.

Embedding: O backend converte a pergunta em vetor usando nomic-embed-text.

Vector Search: O Supabase busca os trechos de texto mais similares.

Filtro (The Guardrail):

Se similaridade < 0.50 ➡️ Retorna "Não consta no documento."

Se similaridade >= 0.50 ➡️ Segue para o próximo passo.

Geração: O contexto recuperado + a pergunta são enviados ao Llama 3.2 com um System Prompt estrito.

Output: A resposta é transmitida via stream para o frontend.

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou Pull Requests.

📝 Licença
Este projeto está sob a licença MIT.

<div align="center"> Desenvolvido por <strong>Eduardo Pereira de Carvalho</strong>


<span>Software Developer | Fullstack | AI Enthusiast</span> </div>
