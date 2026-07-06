'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Button } from '@/components/ui/button';
import { Send, ChevronDown } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center text-zinc-500 text-sm">
      Loading editor…
    </div>
  ),
});

const LANGUAGES = [
  { value: 'python',     label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java',       label: 'Java' },
  { value: 'cpp',        label: 'C++' },
  { value: 'go',         label: 'Go' },
  { value: 'rust',       label: 'Rust' },
];

function MessageBubble({ msg }: { msg: UIMessage }) {
  const isCoach = msg.role === 'assistant';
  const text = msg.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join('');
  return (
    <div className={`text-sm leading-relaxed ${isCoach ? 'text-foreground' : 'text-muted-foreground'}`}>
      <span className={`text-[10px] uppercase tracking-widest font-semibold block mb-1.5 ${isCoach ? 'text-primary' : 'text-zinc-400'}`}>
        {isCoach ? 'Interviewer' : 'You'}
      </span>
      <div className="whitespace-pre-wrap">{text}</div>
    </div>
  );
}

export function TechnicalInterview({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
}) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [thought, setThought] = useState('');

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

  const handleSubmit = () => {
    if (!code.trim()) return;
    const thoughtLine = thought.trim() ? `\n\n**Thought process:** ${thought.trim()}` : '';
    sendMessage({ text: `\`\`\`${language}\n${code}\n\`\`\`${thoughtLine}` });
    setThought('');
  };

  // First coach message is the problem. Subsequent messages are conversation.
  const [problem, ...conversation] = messages;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Technical Interview</span>
          <span className="h-3.5 w-px bg-border/60" />
          {/* Language selector */}
          <div className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-background border border-border/60 rounded-md pl-3 pr-7 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={status === 'streaming' || !code.trim()}
          className="gap-1.5 text-xs h-8"
        >
          <Send className="h-3 w-3" />
          {status === 'streaming' ? 'Evaluating…' : 'Submit solution'}
        </Button>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: problem + feedback */}
        <div className="w-[38%] flex flex-col border-r border-border/50 overflow-hidden">
          {/* Problem statement */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {problem && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-primary block">Problem</span>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {problem.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join('')}
                </div>
              </div>
            )}

            {conversation.length > 0 && (
              <div className="space-y-5 pt-3 border-t border-border/40">
                {conversation.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </div>
            )}

            {status === 'streaming' && (
              <p className="text-xs text-muted-foreground animate-pulse">Evaluating your solution…</p>
            )}
          </div>

          {/* Thought process */}
          <div className="border-t border-border/50 p-4 bg-muted/20 flex-shrink-0">
            <label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-2">
              Thought process (optional)
            </label>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="Explain your approach, complexity, trade-offs…"
              rows={3}
              className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Right: Monaco editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              lineHeight: 20,
              minimap: { enabled: false },
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              tabSize: 4,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
