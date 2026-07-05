import { createClient } from '@/lib/supabase/server';
import { ProgressChart } from '@/components/progress-chart';
import { createSession } from '@/app/actions/sessions';

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PrepCoach</h1>
        <form action={createSession}>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Start new session
          </button>
        </form>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Score trend</h2>
        <ProgressChart data={series} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Past sessions</h2>
        {(sessions ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">No sessions yet — start one above.</p>
        ) : (
          <ul className="divide-y border rounded-lg">
            {(sessions ?? []).map((s: any) => (
              <li key={s.id} className="py-3 px-4 flex justify-between items-center">
                <a href={`/session/${s.id}`} className="hover:underline font-medium">
                  {s.title}
                </a>
                <span className="text-xs text-muted-foreground">{s.created_at.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
