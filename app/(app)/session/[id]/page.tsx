import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { turnToUIMessage } from '@/lib/messages';
import { CoachChat } from '@/components/coach-chat';
import { TechnicalInterview } from '@/components/technical-interview';
import { SystemDesignInterview } from '@/components/system-design-interview';
import { ScenarioInterview } from '@/components/scenario-interview';

function parseFormat(title: string): string {
  if (/Technical/i.test(title))     return 'technical';
  if (/System Design/i.test(title)) return 'system-design';
  if (/Product Sense/i.test(title)) return 'product-sense';
  if (/Case Study/i.test(title))    return 'case-study';
  if (/Leadership/i.test(title))    return 'leadership';
  return 'behavioral';
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, title')
    .eq('id', id)
    .single();

  const { data: turns } = await supabase
    .from('turns')
    .select('id, role, content, scores')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  const initialMessages = (turns ?? []).map(turnToUIMessage);
  const title = session?.title ?? 'Interview session';
  const format = parseFormat(title);

  const initialScores = (turns ?? []).reduce((acc: any, t: any) => {
    if (t.scores) acc[t.id] = t.scores;
    return acc;
  }, {});

  // Technical and system design are full-bleed — no outer padding wrapper
  if (format === 'technical') {
    return <TechnicalInterview sessionId={id} initialMessages={initialMessages} />;
  }

  if (format === 'system-design') {
    return <SystemDesignInterview sessionId={id} initialMessages={initialMessages} />;
  }

  // Scenario types (product-sense, case-study, leadership)
  if (format !== 'behavioral') {
    return (
      <ScenarioInterview
        sessionId={id}
        initialMessages={initialMessages}
        interviewType={format}
      />
    );
  }

  // Behavioral — original chat layout
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>
      <CoachChat
        sessionId={id}
        initialMessages={initialMessages}
        initialScores={initialScores}
      />
    </div>
  );
}
