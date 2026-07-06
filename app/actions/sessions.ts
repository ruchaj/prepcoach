'use server';
import { redirect } from 'next/navigation';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';

const TYPE_LABELS: Record<string, string> = {
  behavioral:      'Behavioral',
  technical:       'Technical',
  'system-design': 'System Design',
  'product-sense': 'Product Sense',
  'case-study':    'Case Study',
  leadership:      'Leadership',
};

const OPENING_ANGLES: Record<string, string[]> = {
  behavioral: [
    'a time you navigated conflict within a team',
    'your biggest professional failure and what it taught you',
    'a time you had to influence without formal authority',
    'handling competing priorities when everything felt urgent',
    'adapting quickly when requirements or circumstances changed mid-project',
    'a time you took ownership of a problem outside your immediate scope',
    'receiving critical feedback that meaningfully changed how you work',
    'working closely with someone whose style clashed with yours',
  ],
  technical: [
    'the hardest bug you have ever tracked down in production',
    'a system you wish you had designed differently and why',
    'how you approach learning an unfamiliar technology under time pressure',
    'a performance problem you diagnosed and fixed end-to-end',
    'making a consequential technical call with incomplete information',
    'a security or reliability issue you caught before it reached users',
    'a time a code review changed your understanding of the problem',
  ],
  'system-design': [
    'a high-throughput event or messaging system',
    'a globally distributed data store with consistency tradeoffs',
    'a search and autocomplete feature at scale',
    'a rate limiter or API gateway',
    'a real-time collaborative editing tool',
    'a content delivery and caching layer',
    'a recommendation or personalization engine',
  ],
  'product-sense': [
    'diagnosing a sudden drop in a key product metric',
    'prioritizing a roadmap when stakeholders disagree',
    'designing for a user segment you have no data on yet',
    'the tradeoff between short-term growth and long-term retention',
    'launching in a new market with limited resources',
    'a product you use every day and how you would meaningfully improve it',
    'deciding when NOT to build a feature users are requesting',
  ],
  'case-study': [
    'entering a new market on a constrained budget',
    'turning around a declining product or business line',
    'estimating market size for an unusual or niche product',
    'a build-vs-buy-vs-partner decision with real tradeoffs',
    'identifying the root cause behind a revenue decline',
    'setting a pricing strategy for a new product or tier',
  ],
  leadership: [
    'setting direction for a team with misaligned expectations',
    'building trust with a skeptical or resistant team',
    'delivering difficult performance feedback to a direct report',
    'rallying a team through a period of uncertainty or low morale',
    'developing someone on your team who did not think they needed it',
    'managing up when you disagreed with leadership\'s direction',
    'scaling a team or process rapidly without sacrificing quality',
  ],
};

const EXPERIENCE_LABELS: Record<string, string> = {
  intern:  'Intern / Entry-level',
  junior:  'Junior (1–3 yrs)',
  mid:     'Mid-level (3–5 yrs)',
  senior:  'Senior (5–8 yrs)',
  staff:   'Staff / Principal (8+ yrs)',
};

const EXPERIENCE_GUIDANCE: Record<string, string> = {
  intern:  'very simple and foundational — ask about a small project, class assignment, or basic concept. No gotchas.',
  junior:  'straightforward — a core concept or a situation from early career. One layer of depth, no edge cases.',
  mid:     'moderate — a real challenge or trade-off they have navigated. Expect some nuance in the answer.',
  senior:  'substantive — involves meaningful trade-offs, system-level thinking, or cross-team impact.',
  staff:   'strategic — organizational impact, technical vision, or influencing across teams without authority.',
};

function pickAngle(interviewType: string): string {
  const pool = OPENING_ANGLES[interviewType] ?? OPENING_ANGLES.behavioral;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function createSession(params: {
  role: string;
  experienceLevel: string;
  interviewType: string;
  jobDescription: string;
  jobUrl: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { role, experienceLevel, interviewType, jobUrl } = params;
  let jobDescription = params.jobDescription;

  // Fall back to fetching the URL if no description was pasted
  if (!jobDescription && jobUrl) {
    try {
      const res = await fetch(jobUrl, { signal: AbortSignal.timeout(5000) });
      const html = await res.text();
      jobDescription = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
    } catch {
      // ignore fetch failures — proceed without job context
    }
  }

  // Persist role + job context to profile so the coach route can read them
  await supabase.from('profiles').upsert({ id: user.id, target_role: role, resume: jobDescription });

  const typeLabel     = TYPE_LABELS[interviewType] ?? interviewType;
  const expLabel      = EXPERIENCE_LABELS[experienceLevel] ?? experienceLevel;
  const expGuidance   = EXPERIENCE_GUIDANCE[experienceLevel] ?? EXPERIENCE_GUIDANCE.mid;

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, title: `${role} — ${typeLabel} (${expLabel})` })
    .select('id').single();

  if (sessionError || !session) throw new Error(sessionError?.message ?? 'Failed to create session');

  const jobCtx = jobDescription
    ? `\n\nJob description:\n${jobDescription.slice(0, 1500)}`
    : '';
  const angle = pickAngle(interviewType);

  const isScenario = ['product-sense', 'case-study', 'leadership'].includes(interviewType);
  const isTechnical = interviewType === 'technical';
  const isSystemDesign = interviewType === 'system-design';

  let openingPrompt: string;

  if (isTechnical) {
    openingPrompt = `You are a technical interviewer opening a coding interview for a ${role} role at the ${expLabel} level.${jobCtx}

Present a single coding problem appropriate for ${expLabel} experience. The problem should be ${expGuidance}
${jobDescription ? 'Align the domain to the skills mentioned in the job description.' : ''}

Format:
- A clear problem statement (2–4 sentences)
- Input/output examples (2–3 examples)
- Any constraints

Output only the problem itself. No solution hints. No "here is your problem:" preamble.`;

  } else if (isSystemDesign) {
    openingPrompt = `You are a system design interviewer opening a session for a ${role} role at the ${expLabel} level.${jobCtx}

Present a single system design challenge appropriate for ${expLabel} experience. The challenge should be ${expGuidance}
${jobDescription ? 'Tie the design domain to the technologies or scale mentioned in the job description.' : ''}

Format:
- 1–2 sentence scenario setting (company + context)
- The design task ("Design a system that…")
- 2–3 specific requirements or constraints to address
- Scale hint (e.g., "Target: 10M daily active users")

Output only the design challenge. No guidance on approach. No preamble.`;

  } else if (isScenario) {
    const scenarioType = typeLabel.toLowerCase();
    openingPrompt = `You are opening an immersive ${scenarioType} interview for a ${role} role at the ${expLabel} level.${jobCtx}

Write a vivid, specific opening scenario. Include:
- A concrete company/product context (name a real or realistic company)
- A specific situation with real metrics, stakeholders, or stakes
- A clear challenge that needs immediate attention
- End with a direct question: "What's your first move?" or "How do you approach this?"

The scenario should be calibrated to ${expLabel} (${expGuidance}).
${jobDescription ? 'Ground the scenario in the industry or responsibilities from the job description.' : ''}

Write 2–4 paragraphs of narrative. Make it feel like a real Monday morning situation. No "here is your scenario:" preamble.`;

  } else {
    // behavioral
    openingPrompt = `You are an interviewer opening a Behavioral interview for a ${role} role at the ${expLabel} level.${jobCtx}

The opening question should be ${expGuidance}

Ask a single opening question specifically about: ${angle}.
${jobDescription ? 'Reference specific skills or responsibilities from the job description above to make it concrete.' : ''}
Output only the question itself — no preamble, no label, no explanation.`;
  }

  const { text: firstQuestion } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    temperature: 1,
    prompt: openingPrompt,
  });

  await supabase.from('turns').insert({
    session_id: session.id, role: 'coach', content: firstQuestion,
  });

  redirect(`/session/${session.id}`);
}
