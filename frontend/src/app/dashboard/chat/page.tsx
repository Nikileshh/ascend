"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { RichText } from "@/components/ui/RichText";

interface Message {
  role: "user" | "coach";
  text: string;
  at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ messages: Message[] }>("/agents/chat")
      .then((r) => setMessages(r.messages))
      .catch((err) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError("");
    setSending(true);
    setMessages((m) => [
      ...m,
      { role: "user", text, at: new Date().toISOString() },
    ]);
    try {
      const r = await api<{ messages: Message[] }>("/agents/chat", {
        body: { message: text },
      });
      setMessages(r.messages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-90px)] max-w-[760px] flex-col px-5 pt-6 pb-4 sm:px-8 sm:pt-14 sm:pb-10 md:h-screen md:px-12">
      <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
        Ask your coach
      </h1>
      <p className="mt-2 text-[16px] text-[#6b6155]">
        Doubts, blockers, questions about your plan. Your coach knows your goal
        and progress.
      </p>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-[20px] border border-[#1f1a14]/[0.09] bg-white/70 p-5 shadow-[0_4px_24px_rgba(24,24,40,0.06)] backdrop-blur-xl">
        {messages.length === 0 && !sending && (
          <p className="text-sm text-[#9a8f80]">
            No messages yet. Try: &quot;What should I focus on this week?&quot;
          </p>
        )}
        {messages.map((m, i) => {
          const user = m.role === "user";
          return (
            <div
              key={i}
              className={`flex ${user ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] border px-4 py-[11px] text-[13.5px] leading-[21px] ${
                  user
                    ? "rounded-2xl rounded-br-md border-[#d9622b]/50 bg-gradient-to-br from-[#d9622b] to-[#b04d18] text-white"
                    : "rounded-2xl rounded-bl-md border-[#1f1a14]/[0.09] bg-[#1f1a14]/[0.03] text-[#4a4239]"
                }`}
              >
                {user ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <RichText text={m.text} />
                )}
              </div>
            </div>
          );
        })}
        {sending && (
          <p className="animate-pulse text-[12.5px] text-[#9a8f80]">
            Coach is typing…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-[#b5551f]">{error}</p>}

      <form onSubmit={send} className="mt-3.5 flex gap-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="min-w-0 flex-1 rounded-full border border-[#1f1a14]/15 bg-white/80 px-5 py-3 text-[13.5px] text-[#1f1a14] placeholder-[#9a8f80] transition-colors outline-none focus:border-[#d9622b]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 rounded-full border border-[#d9622b]/50 bg-gradient-to-br from-[#d9622b] to-[#b04d18] px-6 py-3 text-[13.5px] font-medium text-white shadow-[0_0_20px_rgba(217,98,43,0.28)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-45"
        >
          Send
        </button>
      </form>
    </main>
  );
}
