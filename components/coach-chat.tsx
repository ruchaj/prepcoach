'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useState } from 'react';
import { FeedbackCard } from './feedback-card';

type Scores = {
  clarity: number;
  specificity: number;
  starStructure: number;
  relevance: number;
  notes: string;
};

export function CoachChat({
  sessionId,
  initialMessages,
  initialScores = {},
}: {
  sessionId: string;
  initialMessages: UIMessage[];
  initialScores?: Record<string, Scores>;
}) {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/coach',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { sessionId: id, message: messages[messages.length - 1] },
      }),
    }),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4 min-h-[300px]">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex flex-col items-end' : ''}>
            <span className="text-xs uppercase text-muted-foreground mb-1">
              {m.role === 'user' ? 'You' : 'Coach'}
            </span>
            <div
              className={`rounded-lg px-4 py-3 text-sm max-w-[85%] ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {m.parts.map((p, i) =>
                p.type === 'text' ? (
                  <p key={i} className="whitespace-pre-wrap">
                    {p.text}
                  </p>
                ) : null
              )}
            </div>
            {m.role === 'user' && initialScores[m.id] && (
              <div className="mt-2 w-full max-w-[85%]">
                <FeedbackCard scores={initialScores[m.id]} />
              </div>
            )}
          </div>
        ))}

        {status === 'streaming' && (
          <div className="text-muted-foreground text-sm animate-pulse">Coach is typing…</div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
        className="flex gap-2 pt-2 border-t"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          disabled={status === 'streaming'}
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {status === 'streaming' ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
