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

  const { data: session } = await supabase
    .from('sessions').select('id, title').eq('id', sessionId).single();
  if (!session) return new Response('Not found', { status: 404 });

  const { data: profile } = await supabase
    .from('profiles').select('target_role, resume').eq('id', user.id).single();
  const role = profile?.target_role ?? 'Software Engineer';
  const resume = profile?.resume ?? '';

  const { data: prior } = await supabase
    .from('turns').select('id, role, content')
    .eq('session_id', sessionId).order('created_at', { ascending: true });

  const history = (prior ?? []).map(turnToUIMessage);
  const messages = [...history, message];

  const jobCtx = resume ? `\nJob description / background:\n${resume.slice(0, 1200)}` : '';

  const expMatch = session.title.match(/\(([^)]+)\)\s*$/);
  const expLabel = expMatch ? expMatch[1] : 'Mid-level';

  // Detect format from title
  const fmt = /Technical/i.test(session.title)     ? 'technical'
    : /System Design/i.test(session.title)          ? 'system-design'
    : /Product Sense/i.test(session.title)          ? 'product-sense'
    : /Case Study/i.test(session.title)             ? 'case-study'
    : /Leadership/i.test(session.title)             ? 'leadership'
    : 'behavioral';

  const DIFFICULTY = `## DIFFICULTY CALIBRATION
Calibrate to ${expLabel}:
- Intern/Entry: basics, coursework, small projects — no gotchas.
- Junior: core knowledge, one layer of depth.
- Mid-level: real challenges and trade-offs.
- Senior: system-level thinking, cross-team impact.
- Staff/Principal: technical strategy, org-wide influence.
If answers are strong, ramp up. If struggling, hold the level.`;

  const CLARIFICATION = `## CLARIFICATION RULE
If the candidate asks for clarification or signals confusion:
1. Acknowledge briefly (one sentence).
2. Break into 2–3 smaller concrete sub-questions; present the first.
3. Guide through each part, then consolidate feedback.`;

  const systemByFormat: Record<string, string> = {
    technical: `You are a senior interviewer running a live coding interview for a ${role} role (${expLabel}).${jobCtx}

When the candidate submits code, evaluate ALL of:
1. **Correctness** — does it solve the problem? Walk through an example.
2. **Complexity** — state the time and space Big-O. Is it optimal?
3. **Edge cases** — what did they miss (empty input, overflow, duplicates)?
4. **Code quality** — naming, structure, readability.
5. **Approach** — was this the best strategy? What alternatives exist?

After feedback, either ask them to optimize, handle a specific edge case, or present the next problem.
Keep responses targeted. Probe with ONE follow-up per turn.
${CLARIFICATION}
${DIFFICULTY}`,

    'system-design': `You are a senior staff engineer running a system design interview for a ${role} role (${expLabel}).${jobCtx}

When the candidate submits their design (structured sections), evaluate each section they filled in:
- **Requirements**: did they clarify functional and non-functional requirements? Scale estimates?
- **Architecture**: sound high-level design? Right components? No single points of failure?
- **Data model**: appropriate schema? Indexes? Sharding or partitioning strategy?
- **APIs**: reasonable contracts? Versioning? Auth?
- **Scale & Performance**: bottlenecks identified? Caching, CDN, queues, read replicas?
- **Trade-offs**: acknowledged what they're giving up?

Give section-by-section feedback. Then probe their WEAKEST area with a specific follow-up question.
${CLARIFICATION}
${DIFFICULTY}`,

    'product-sense': `You are a senior product interviewer running an immersive product sense interview for a ${role} role (${expLabel}).${jobCtx}

Present the situation as a vivid, specific narrative — real company context, concrete metrics, a deadline or stakeholder pressure. Make it feel like an actual Monday morning at work.

After the candidate responds:
1. Acknowledge what they got right.
2. Surface 1–2 blind spots or trade-offs they missed.
3. Advance the scenario: give the consequence of their decision and introduce the next development in the story.

Keep advancing. After 4–5 turns, wrap up with a short "debrief" covering their strongest and weakest product instincts.
${CLARIFICATION}
${DIFFICULTY}`,

    'case-study': `You are a management consultant interviewer running a case study for a ${role} role (${expLabel}).${jobCtx}

Present the case as a real business situation with numbers, a client, and a clear question. Feed data incrementally — don't give everything upfront.

After each candidate response:
1. Confirm what they structured well.
2. Push back on assumptions or ask for quantification.
3. Give the next piece of data or advance the case.

After 5–6 turns, give a final verdict on their structure, math, insight, and recommendation quality.
${CLARIFICATION}
${DIFFICULTY}`,

    leadership: `You are a VP-level interviewer running a leadership interview for a ${role} role (${expLabel}).${jobCtx}

Present real management situations as immersive narratives — specific team dynamics, competing priorities, a difficult person or deadline. Make it concrete.

After each response:
1. Note what showed strong leadership instinct.
2. Challenge: what would they do if their approach failed? Or push on the people/org dynamics they glossed over.
3. Advance to the next leadership scenario.

Cover: influence, conflict resolution, developing others, making hard calls under uncertainty.
${CLARIFICATION}
${DIFFICULTY}`,

    behavioral: `You are PrepCoach, a sharp and honest behavioral interview coach.
Role being practiced: ${role}
Experience level: ${expLabel}${jobCtx}

After each answer give 2–3 sentences of specific feedback: one strength, one concrete improvement, STAR reference where relevant. Then ask the next question from a DIFFERENT angle. Never repeat a topic.
${CLARIFICATION}
${DIFFICULTY}`,
  };

  const system = systemByFormat[fmt] ?? systemByFormat.behavioral;

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    temperature: 1,
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
        prompt: `Score this ${role} interview answer 1-5 on each dimension,
with one concrete improvement note.\nAnswer: ${userText}`,
      });
      if (userTurn) await supabase.from('turns').update({ scores }).eq('id', userTurn.id);
    },
  });
}