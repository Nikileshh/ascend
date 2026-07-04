"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { RichText } from "@/components/ui/RichText";
import { inputClass } from "@/components/ui/AuthCard";

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
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
        Ask your coach
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Doubts, blockers, questions about your plan — your coach knows your goal
        and your progress.
      </p>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        {messages.length === 0 && !sending && (
          <p className="text-sm text-zinc-500">
            No messages yet. Try: &quot;What should I focus on this week?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {m.role === "coach" ? (
                <RichText text={m.text} />
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <p className="animate-pulse text-sm text-zinc-500">
            Coach is typing…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <form onSubmit={send} className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Send
        </button>
      </form>
    </div>
  );
}
