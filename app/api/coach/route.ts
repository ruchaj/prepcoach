// app/api/coach/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import {
  streamText, convertToModelMessages, generateObject, type UIMessage,
} from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { turnToUIMessage, extractText } from '@/lib/messages';

export const maxDuration = 30;

const ScoreSchema = z.object({
  clarity:       z.number().min(1).max(5),
  specificity:   z.number().min(1).max(5),
  starStructure: z.number().min(1).max(5),
  relevance:     z.number().min(1).max(5),
  notes:         z.string(),
});

export async function POST(req: Request) {
  const { sessionId, message }: { sessionId: string; message: UIMessage } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // RLS already scopes this to the user; .single() also fails if it's not theirs
  const { data: session } = await supabase
    .from('sessions').select('id, target_role, resume').eq('id', sessionId).single();
  if (!session) return new Response('Not found', { status: 404 });

  const { data: prior } = await supabase
    .from('turns').select('id, role, content')
    .eq('session_id', sessionId).order('created_at', { ascending: true });

  const history = (prior ?? []).map(turnToUIMessage);
  const messages = [...history, message];

  const system = `You are PrepCoach, a sharp but supportive interview coach.
The candidate is interviewing for: ${session.target_role}.
Background: ${session.resume}
Rules: ask ONE role-relevant question at a time. After each answer, give specific, actionable
feedback (what worked, what to improve, reference the STAR method where useful), THEN ask the
next question. Never ask more than one question per turn. Keep momentum.`;

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: final }) => {
      const assistant = final[final.length - 1];
      const userText = extractText(message);

      // persist the user answer, then the coach reply
      const { data: userTurn } = await supabase
        .from('turns')
        .insert({ session_id: sessionId, role: 'user', content: userText })
        .select('id').single();

      await supabase.from('turns').insert({
        session_id: sessionId, role: 'coach', content: extractText(assistant),
      });

      // score the answer and attach to the user turn
      const { object: scores } = await generateObject({
        model: anthropic('claude-sonnet-4-6'),
        schema: ScoreSchema,
        prompt: `Score this ${session.target_role} interview answer 1-5 on each dimension,
with one concrete improvement note.\nAnswer: ${userText}`,
      });
      if (userTurn) await supabase.from('turns').update({ scores }).eq('id', userTurn.id);
    },
  });
}