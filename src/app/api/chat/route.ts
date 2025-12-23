import { db } from '@/db';
import { embeddings } from '@/db/schema';
import { desc, gt, sql } from 'drizzle-orm';

export const maxDuration = 60;

async function getEmbeddingWithRetry(text: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();

      const timeoutId = setTimeout(() => controller.abort(), 5000); 

      const resp = await fetch('http://127.0.0.1:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            model: 'nomic-embed-text', 
            prompt: `search_query: ${text}`,
            keep_alive: -1 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data.embedding && data.embedding.length > 0) return data.embedding;
      }
    } catch (e) {
      if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    const queryVector = await getEmbeddingWithRetry(query);

    if (!queryVector) {
        return new Response("O sistema está carregando. Tente novamente.", { status: 503 });
    }

    const SIMILARITY_THRESHOLD = 0.50; 

    const relevantDocs = await db.select({ 
        content: embeddings.content
      })
      .from(embeddings)
      .where(gt(sql`1 - (${embeddings.embedding} <=> ${JSON.stringify(queryVector)}::vector)`, SIMILARITY_THRESHOLD))
      .orderBy(desc(sql`1 - (${embeddings.embedding} <=> ${JSON.stringify(queryVector)}::vector)`))
      .limit(2);

    if (relevantDocs.length === 0) {
        return new Response("Não consta no documento.", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    const contextText = relevantDocs
          .map(d => d.content.replace(/\n/g, ' ').replace(/\s+/g, ' '))
          .join('\n---\n');

    const systemPrompt = `Você é um assistente útil e preciso.
    
    INSTRUÇÕES:
    1. Use as informações do texto abaixo para responder à pergunta do usuário.
    2. Se a resposta NÃO estiver no texto, responda apenas: "Não consta no documento."
    
    TEXTO DE REFERÊNCIA:
    ${contextText}`;

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages 
        ],
        stream: true,
        options: { 
            temperature: 0,
            num_ctx: 1024,     
            num_predict: 256,
            num_thread: 4     
        },
        keep_alive: -1
      }),
    });

    if (!response.ok) throw new Error("Erro Ollama");

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
           const lines = chunk.split('\n');
           for (const line of lines) {
             if (!line.trim()) continue;
             try {
               const json = JSON.parse(line);
               if (json.message?.content) {
                 controller.enqueue(new TextEncoder().encode(json.message.content));
               }
             } catch (e) {}
           }
        }
        controller.close();
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}