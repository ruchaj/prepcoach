import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, MessageSquare, TrendingUp, Layers, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Role-specific questions",
    description:
      "Paste a job description and every question is pulled from the actual requirements — not generic templates.",
  },
  {
    icon: MessageSquare,
    title: "Real-time feedback",
    description:
      "After every answer: what worked, what to sharpen, and a STAR-method breakdown when it applies.",
  },
  {
    icon: Layers,
    title: "Adaptive difficulty",
    description:
      "Sessions start at your experience level and scale up. Ask for clarification and the question breaks into guided steps.",
  },
  {
    icon: TrendingUp,
    title: "Score tracking",
    description:
      "Every answer is scored on clarity, specificity, structure, and relevance — charted across all your sessions.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Set your context",
    description:
      "Enter your target role, experience level, interview type, and paste the job description you are applying for.",
  },
  {
    step: "02",
    title: "Practice live",
    description:
      "The AI interviewer asks questions calibrated to you and gives honest, specific feedback after every answer.",
  },
  {
    step: "03",
    title: "Track improvement",
    description:
      "See your scores trend upward across sessions and know exactly where to focus your preparation.",
  },
];

const STATS = [
  { value: "6", label: "Interview types" },
  { value: "5", label: "Experience levels" },
  { value: "4", label: "Scoring dimensions" },
  { value: "∞", label: "Unique questions" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">PrepCoach</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/auth/sign-up">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 50% -5%, hsl(var(--primary) / 0.18), transparent 70%)",
            }}
          />
          {/* Subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="max-w-4xl mx-auto px-6 pt-28 pb-24 text-center flex flex-col items-center gap-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
              AI-powered mock interview coaching
            </div>

            <h1 className="text-5xl sm:text-[64px] font-bold tracking-tight leading-[1.08]">
              Ace your next interview
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.55) 100%)",
                }}
              >
                with an AI coach
              </span>
            </h1>

            <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
              PrepCoach runs live mock interviews tailored to your role and the
              exact job you&apos;re applying for, then gives you honest, actionable
              feedback after every answer.
            </p>

            <div className="flex items-center gap-3 mt-1">
              <Button asChild size="lg" className="gap-2 px-6 shadow-md">
                <Link href="/auth/sign-up">
                  Start practicing free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-6">
                <Link href="/auth/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-border/50 bg-muted/25">
          <div className="max-w-4xl mx-auto px-6 py-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <span className="text-3xl font-bold tracking-tight">{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Not a question bank. A coaching session.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
              Personalized to your role, level, and the specific job you want.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/60 bg-card p-7 hover:border-border hover:shadow-sm transition-all duration-200"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/50 bg-muted/20">
          <div className="max-w-4xl mx-auto px-6 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="text-muted-foreground mt-3">
                From zero to confident in three steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-12">
              {STEPS.map((s) => (
                <div key={s.step} className="flex flex-col gap-4">
                  <span
                    className="text-5xl font-bold tracking-tight"
                    style={{ color: "hsl(var(--border))" }}
                  >
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1.5">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative overflow-hidden border-t border-border/50">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 50% 110%, hsl(var(--primary) / 0.14), transparent 65%)",
            }}
          />
          <div className="max-w-2xl mx-auto px-6 py-28 text-center flex flex-col items-center gap-6">
            <h2 className="text-4xl font-bold tracking-tight">
              Your next offer starts here.
            </h2>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              Get personalized coaching tailored to your role, your level, and
              the job you actually want.
            </p>
            <Button asChild size="lg" className="gap-2 px-8 shadow-md mt-2">
              <Link href="/auth/sign-up">
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-7 text-center text-xs text-muted-foreground">
        PrepCoach — AI-powered interview practice
      </footer>
    </div>
  );
}
