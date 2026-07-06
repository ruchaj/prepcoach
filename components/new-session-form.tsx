'use client';
import { useState, useMemo } from 'react';
import { createSession } from '@/app/actions/sessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ALL_TYPES = [
  { value: 'behavioral',    label: 'Behavioral' },
  { value: 'technical',     label: 'Technical / Domain Knowledge' },
  { value: 'system-design', label: 'System Design' },
  { value: 'product-sense', label: 'Product Sense' },
  { value: 'case-study',    label: 'Case Study' },
  { value: 'leadership',    label: 'Leadership' },
] as const;

type TypeValue = typeof ALL_TYPES[number]['value'];

const EXPERIENCE_LEVELS = [
  { value: 'intern',  label: 'Intern / Entry-level' },
  { value: 'junior',  label: 'Junior (1–3 yrs)' },
  { value: 'mid',     label: 'Mid-level (3–5 yrs)' },
  { value: 'senior',  label: 'Senior (5–8 yrs)' },
  { value: 'staff',   label: 'Staff / Principal (8+ yrs)' },
] as const;

type ExperienceValue = typeof EXPERIENCE_LEVELS[number]['value'];

function orderedTypes(role: string): typeof ALL_TYPES[number][] {
  const r = role.toLowerCase();
  let order: TypeValue[];

  if (/engineer|developer|software|swe|sde|programmer/.test(r)) {
    order = ['technical', 'system-design', 'behavioral', 'leadership', 'case-study', 'product-sense'];
  } else if (/product manager|pm\b|product owner/.test(r)) {
    order = ['product-sense', 'behavioral', 'case-study', 'leadership', 'technical', 'system-design'];
  } else if (/manager|director|vp |head of|team lead/.test(r)) {
    order = ['leadership', 'behavioral', 'case-study', 'product-sense', 'technical', 'system-design'];
  } else if (/data|analyst|scientist|machine learning|ml\b/.test(r)) {
    order = ['technical', 'case-study', 'behavioral', 'system-design', 'leadership', 'product-sense'];
  } else if (/design|ux|ui\b/.test(r)) {
    order = ['behavioral', 'case-study', 'product-sense', 'leadership', 'technical', 'system-design'];
  } else {
    order = ['behavioral', 'technical', 'case-study', 'leadership', 'product-sense', 'system-design'];
  }

  return order.map(v => ALL_TYPES.find(t => t.value === v)!);
}

export function NewSessionForm() {
  const [role, setRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceValue>('mid');
  const [interviewType, setInterviewType] = useState<TypeValue>('behavioral');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types = useMemo(() => orderedTypes(role), [role]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRole(v);
    setInterviewType(orderedTypes(v)[0].value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await createSession({ role: role.trim(), experienceLevel, interviewType, jobDescription, jobUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="role">Target Role</Label>
        <Input
          id="role"
          placeholder="e.g. Senior Software Engineer, Product Manager"
          value={role}
          onChange={handleRoleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experience-level">Experience Level</Label>
          <select
            id="experience-level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceValue)}
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {EXPERIENCE_LEVELS.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview-type">Interview Type</Label>
          <select
            id="interview-type"
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value as TypeValue)}
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {types.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Interview type suggestions reorder as you type your role.
      </p>

      <div className="space-y-2">
        <Label htmlFor="job-description">
          Job Description{' '}
          <span className="text-muted-foreground font-normal">(optional — paste to tailor questions)</span>
        </Label>
        <textarea
          id="job-description"
          placeholder="Paste the job description here…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={6}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-url">
          Job Posting URL{' '}
          <span className="text-muted-foreground font-normal">(optional — used if no description pasted)</span>
        </Label>
        <Input
          id="job-url"
          type="url"
          placeholder="https://…"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading || !role.trim()}>
        {isLoading ? 'Starting session…' : 'Start Interview'}
      </Button>
    </form>
  );
}
