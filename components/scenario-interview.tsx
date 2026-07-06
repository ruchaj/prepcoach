'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

function getText(msg: UIMessage) {
  return msg.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join('');
}

function ScenarioCard({ text, turn }: { text: string; turn: number }) {
  return (
    <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* accent strip */}
      <div className="absolute inset-y-0 left-0 w-0.5 bg-primary/60" />
      <div className="px-6 py-5">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-primary block mb-3">
          {turn === 0 ? 'Situation' : `Scenario continues — step ${turn}`}
        </span>
        <p className="text-sm leading-[1.75] whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function UserCard({ text, turn }: { text: string; turn: number }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mr-1">
        Your decision {turn > 0 ? `(step ${turn})` : ''}
      </span>
      <div className="max-w-[85%] rounded-xl bg-primary/10 border border-primary/20 px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

export function ScenarioInterview({
  sessionId,
  initialMessages,
  interviewType,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
  interviewType: string;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/coach',
      prepareSendMessagesRequest: ({ id, messages: msgs }) => ({
        body: { sessionId: id, message: msgs[msgs.length - 1] },
      }),
    }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming') return;
    sendMessage({ text: input.trim() });
    setInput('');
  };

  // Track which coach message we're on for step numbering
  let coachTurn = 0;
  let userTurn = 0;

  const typeLabel = {
    'product-sense': 'Product Sense',
    'case-study': 'Case Study',
    leadership: 'Leadership',
  }[interviewType] ?? interviewType;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30 px-6 py-2.5 flex-shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {typeLabel} · Scenario Interview
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 max-w-3xl w-full mx-auto">
        {messages.map((m) => {
          if (m.role === 'assistant') {
            const t = coachTurn++;
            return <ScenarioCard key={m.id} text={getText(m)} turn={t} />;
          } else {
            const t = userTurn++;
            return <UserCard key={m.id} text={getText(m)} turn={t} />;
          }
        })}

        {status === 'streaming' && (
          <div className="rounded-xl border border-border/50 bg-muted/20 px-6 py-5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-primary block mb-2">
              Scenario continues…
            </span>
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block">
              Your decision
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="What would you do? Walk through your thinking…"
              disabled={status === 'streaming'}
              rows={3}
              className="w-full border border-border/60 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground">⌘ + Enter to submit</p>
          </div>
          <Button
            type="submit"
            disabled={status === 'streaming' || !input.trim()}
            className="gap-1.5 mb-6"
          >
            Submit
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
