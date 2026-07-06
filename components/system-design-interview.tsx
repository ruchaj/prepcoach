'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle } from 'lucide-react';

const SECTIONS = [
  {
    id: 'requirements',
    label: 'Requirements',
    short: 'Req.',
    placeholder: 'Clarify functional and non-functional requirements. Who are the users? What scale are we designing for? What are the latency, availability, and consistency needs?',
  },
  {
    id: 'architecture',
    label: 'High-Level Architecture',
    short: 'Architecture',
    placeholder: 'Sketch the major components and how they interact. Client → API gateway → services → storage? What are the main services and their responsibilities?',
  },
  {
    id: 'datamodel',
    label: 'Data Model',
    short: 'Data',
    placeholder: 'Define your main entities and how they relate. SQL vs NoSQL? What does the schema look like? Indexes, partitioning strategy?',
  },
  {
    id: 'apis',
    label: 'API Design',
    short: 'APIs',
    placeholder: 'Define the key endpoints. REST, GraphQL, or gRPC? Sketch request/response shapes for the most critical operations.',
  },
  {
    id: 'scale',
    label: 'Scale & Performance',
    short: 'Scale',
    placeholder: 'How does the system handle 10x, 100x load? Where are the bottlenecks? Caching layers, CDN, read replicas, horizontal scaling, message queues?',
  },
  {
    id: 'tradeoffs',
    label: 'Trade-offs',
    short: 'Trade-offs',
    placeholder: 'What are you sacrificing? Consistency vs availability? Complexity vs performance? What would you revisit with more time?',
  },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

function getText(msg: UIMessage) {
  return msg.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join('');
}

export function SystemDesignInterview({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
}) {
  const [activeSection, setActiveSection] = useState<SectionId>('requirements');
  const [content, setContent] = useState<Record<SectionId, string>>({
    requirements: '',
    architecture: '',
    datamodel: '',
    apis: '',
    scale: '',
    tradeoffs: '',
  });

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

  const filledCount = SECTIONS.filter((s) => content[s.id].trim()).length;

  const handleSubmit = () => {
    const parts = SECTIONS
      .filter((s) => content[s.id].trim())
      .map((s) => `## ${s.label}\n${content[s.id].trim()}`)
      .join('\n\n');
    if (!parts) return;
    sendMessage({ text: parts });
  };

  const [problem, ...feedback] = messages;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="border-b border-border/50 bg-muted/30 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">System Design</span>
          <span className="h-3.5 w-px bg-border/60" />
          <span className="text-xs text-muted-foreground">
            {filledCount}/{SECTIONS.length} sections
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={status === 'streaming' || filledCount === 0}
          className="gap-1.5 text-xs h-8"
        >
          <Send className="h-3 w-3" />
          {status === 'streaming' ? 'Evaluating…' : 'Submit design'}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: problem + feedback */}
        <div className="w-[35%] border-r border-border/50 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {problem && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-primary block">Design Challenge</span>
                <p className="text-sm leading-relaxed">{getText(problem)}</p>
              </div>
            )}
            {feedback.length > 0 && (
              <div className="space-y-5 pt-3 border-t border-border/40">
                {feedback.map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold block ${m.role === 'assistant' ? 'text-primary' : 'text-zinc-400'}`}>
                      {m.role === 'assistant' ? 'Interviewer' : 'Your submission'}
                    </span>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{getText(m)}</p>
                  </div>
                ))}
              </div>
            )}
            {status === 'streaming' && (
              <p className="text-xs text-muted-foreground animate-pulse">Reviewing your design…</p>
            )}
          </div>
        </div>

        {/* Right: section tabs + textarea */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Section tabs */}
          <div className="flex border-b border-border/50 bg-muted/20 overflow-x-auto flex-shrink-0">
            {SECTIONS.map((s) => {
              const filled = content[s.id].trim().length > 0;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeSection === s.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filled && <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                  {s.short}
                </button>
              );
            })}
          </div>

          {/* Active section editor */}
          {SECTIONS.map((s) =>
            s.id === activeSection ? (
              <div key={s.id} className="flex-1 flex flex-col min-h-0 p-4">
                <label className="text-xs font-semibold mb-2 block">{s.label}</label>
                <textarea
                  value={content[s.id]}
                  onChange={(e) => setContent((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  placeholder={s.placeholder}
                  className="flex-1 bg-background border border-border/60 rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring font-mono leading-relaxed"
                />
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
