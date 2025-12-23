#  MentorIA - RAG Local com Validação Estrita

O **MentorIA** é um sistema de **RAG (Retrieval-Augmented Generation)** que roda 100% localmente para analisar documentos técnicos. O foco do projeto é a **Engenharia de Software** aplicada à IA para resolver problemas de alucinação, privacidade e latência.

---

##  Diferenciais de Engenharia

1.  **🛡️ Guardrails Anti-Alucinação:** Implementação de um *Cosine Similarity Threshold* de `0.50`. Perguntas fora do contexto (ex: "Futebol" em um TCC de Farmácia) são bloqueadas matematicamente antes de acionar a LLM.
2.  **❄️ Resiliência (Cold Start):** Sistema de **Retry com Backoff Exponencial**. Se o Ollama estiver descarregado da RAM, o backend aguarda e reconecta automaticamente.
3.  **⚡ Performance:** Uso de índices **HNSW** no Supabase para buscas vetoriais em milissegundos.
4.  **🏗️ Arquitetura Sólida:** Separação clara entre Ingestão (Python), Banco de Dados (Drizzle ORM) e API (Next.js).

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS.
- **Backend:** Next.js Server Actions & API Routes.
- **Database:** Supabase (PostgreSQL + pgvector).
- **ORM:** Drizzle ORM.
- **AI Engine:** Ollama (Local).
  - Modelo: `llama3.2:1b`
  - Embeddings: `nomic-embed-text`
- **Ingestão:** Python scripts.

---

## ⚙️ Instalação e Configuração

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text

-- Habilitar extensão vetorial
create extension vector;

-- Tabela de Embeddings
create table embeddings (
  id serial primary key,
  content text not null,
  embedding vector(768) -- Compatível com nomic-embed-text
);

-- Índice HNSW para performance extrema
create index on embeddings using hnsw (embedding vector_cosine_ops);

# Clone o repositório
git clone https://github.com/eduardocarvalho21/Mentor_IA.git

# Entre na pasta
cd Mentor_IA

# Instale as dependências
npm install

DATABASE_URL=postgres://usuario:senha@host:6543/postgres
NEXT_PUBLIC_API_URL=http://localhost:3000

npm run dev

Acesse http://localhost:3000.

Como Funciona:

Ingestão: Script Python quebra o PDF em chunks e salva os vetores no Supabase.

Pergunta: O usuário envia uma dúvida.

Validação: O Backend calcula a similaridade. Se < 0.50, retorna "Não consta no documento".

Resposta: Se aprovado, o Llama 3.2 recebe o contexto e gera a resposta via Stream.

Licença
Desenvolvido por Eduardo Pereira de Carvalho.
