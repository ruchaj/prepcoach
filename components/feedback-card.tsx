type Scores = {
  clarity: number;
  specificity: number;
  starStructure: number;
  relevance: number;
  notes: string;
};

export function FeedbackCard({ scores }: { scores: Scores }) {
  const rows = [
    ['Clarity', scores.clarity],
    ['Specificity', scores.specificity],
    ['STAR structure', scores.starStructure],
    ['Relevance', scores.relevance],
  ] as const;

  return (
    <div className="rounded-lg border bg-background p-3 text-sm space-y-1">
      {rows.map(([label, v]) => (
        <div key={label} className="flex justify-between">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono font-medium">{v}/5</span>
        </div>
      ))}
      {scores.notes && (
        <p className="text-muted-foreground pt-1 border-t text-xs">{scores.notes}</p>
      )}
    </div>
  );
}
