import { createClient } from '@/lib/supabase/server';
import { turnToUIMessage } from '@/lib/messages';
import { CoachChat } from '@/components/coach-chat';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, title, target_role')
    .eq('id', id)
    .single();

  const { data: turns } = await supabase
    .from('turns')
    .select('id, role, content, scores')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  const initialMessages = (turns ?? []).map(turnToUIMessage);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold">{session?.title ?? 'Interview session'}</h1>
          {session?.target_role && (
            <p className="text-sm text-muted-foreground">{session.target_role}</p>
          )}
        </div>
        <a href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Dashboard
        </a>
      </div>

      <CoachChat
        sessionId={id}
        initialMessages={initialMessages}
        initialScores={(turns ?? []).reduce((acc: any, t: any) => {
          if (t.scores) acc[t.id] = t.scores;
          return acc;
        }, {})}
      />
    </div>
  );
}
