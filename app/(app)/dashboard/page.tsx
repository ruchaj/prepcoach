import Link from 'next/link';
import { ArrowRight, Clock, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProgressChart } from '@/components/progress-chart';
import { Button } from '@/components/ui/button';

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, created_at')
    .order('created_at', { ascending: false });

  const { data: scored } = await supabase
    .from('turns')
    .select('created_at, scores')
    .not('scores', 'is', null)
    .order('created_at', { ascending: true });

  const series = (scored ?? []).map((t: any) => {
    const s = t.scores;
    return {
      date: t.created_at.slice(0, 10),
      avg: (s.clarity + s.specificity + s.starStructure + s.relevance) / 4,
    };
  });

  const sessionList = sessions ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your progress and start new sessions.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/new-session">
            <Plus className="h-4 w-4" />
            New session
          </Link>
        </Button>
      </div>

      {/* Score trend */}
      <section className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Score trend</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Average across clarity, specificity, structure, and relevance
          </p>
        </div>
        <ProgressChart data={series} />
      </section>

      {/* Past sessions */}
      <section className="space-y-4">
        <h2 className="font-semibold">Past sessions</h2>

        {sessionList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              No sessions yet. Start your first mock interview to see results here.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/new-session">
                <Plus className="h-3.5 w-3.5" />
                Start first session
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessionList.map((s: any) => (
              <li key={s.id}>
                <Link
                  href={`/session/${s.id}`}
                  className="group flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-4 hover:border-border hover:shadow-sm transition-all duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm truncate">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs text-muted-foreground">
                      {s.created_at.slice(0, 10)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
