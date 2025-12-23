import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white text-center">
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
        MentorIA
      </h1>
      <p className="text-xl text-gray-400 mb-8 max-w-lg">
        Sua inteligência artificial pessoal para dominar editais e provas de concurso.
      </p>
      
      <Link 
        href="/chat" 
        className="px-8 py-4 bg-blue-600 rounded-full font-bold text-lg hover:bg-blue-500 transition shadow-lg hover:scale-105"
      >
        Começar a Estudar
      </Link>
    </main>
  );
}