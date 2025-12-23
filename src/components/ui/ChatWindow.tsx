'use client';

import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

// Definição do tipo de mensagem para o TypeScript não reclamar
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput(""); // Limpa o campo
    setIsLoading(true);

    try {
      //Faz a chamada para o backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }), 
      });

      if (!response.body) throw new Error("Sem resposta do servidor");

      //Prepara para receber a resposta da IA (Streaming)
      const aiMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev, 
        { id: aiMessageId, role: 'assistant', content: "" }
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiResponseText += chunk;

        // Atualiza a mensagem da IA em tempo real
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: aiResponseText } : msg
          )
        );
      }

    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
      
      {/* Cabeçalho */}
      <div className="bg-slate-900 p-4 text-white flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
        <h2 className="font-bold text-lg">MentorIA</h2>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-xl font-semibold mb-2">Olá!</p>
            <p>O sistema está pronto. Pergunte sobre o conteúdo.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
            }`}>
              <div className="text-sm leading-relaxed prose prose-invert">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs animate-pulse">
               Processando resposta...
             </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)} // Controle manual simples
          placeholder="Digite sua dúvida..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}