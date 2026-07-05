// app/actions/sessions.ts
'use server';
import { redirect } from 'next/navigation';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';

export async function createSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles').select('target_role, resume').eq('id', user.id).single();

  const role = profile?.target_role ?? 'Software Engineer';
  const resume = profile?.resume ?? '';

  const { data: session } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, title: `${role} mock`, target_role: role, resume })
    .select('id').single();

  // generate question 1 and store it as the opening coach turn
  const { text: firstQuestion } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt: `You are an interviewer for a ${role} role. Ask a strong opening interview
question. Output only the question.`,
  });
  await supabase.from('turns').insert({
    session_id: session!.id, role: 'coach', content: firstQuestion,
  });

  redirect(`/session/${session!.id}`);
}