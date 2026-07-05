'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function ProgressChart({ data }: { data: { date: string; avg: number }[] }) {
  if (!data.length) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        No scored answers yet. Complete a session to see your progress.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : v)} />
        <Line type="monotone" dataKey="avg" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
