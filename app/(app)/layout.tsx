import Link from "next/link";
import { Zap } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold tracking-tight">PrepCoach</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-5 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
