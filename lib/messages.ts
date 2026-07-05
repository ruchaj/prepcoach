// lib/messages.ts
import type { UIMessage } from 'ai';

export function turnToUIMessage(t: { id: string; role: string; content: string }): UIMessage {
  return {
    id: t.id,
    role: t.role === 'coach' ? 'assistant' : 'user',
    parts: [{ type: 'text', text: t.content }],
  };
}

export function extractText(m: UIMessage): string {
  return m.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join('');
}