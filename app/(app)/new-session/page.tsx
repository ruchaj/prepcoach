import { NewSessionForm } from '@/components/new-session-form';

export default function NewSessionPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Interview Session</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set your target role and focus area to get tailored questions.
        </p>
      </div>
      <NewSessionForm />
    </div>
  );
}
