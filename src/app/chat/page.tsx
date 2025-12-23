import ChatComponent from "@/components/ui/ChatWindow";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">MentorIA</h1>
      <ChatComponent />
    </main>
  );
}