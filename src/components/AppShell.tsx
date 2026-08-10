import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Brain,
  CircleDot,
  Crown,
  Grid3X3,
  Home,
  Menu,
  Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/play/tic-tac-toe", label: "Tic-Tac-Toe", icon: Grid3X3 },
  { to: "/play/connect-4", label: "Connect-4", icon: CircleDot },
  { to: "/play/checkers", label: "Checkers", icon: Crown },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/learn", label: "Learning Center", icon: Brain },
] as const;

export function AppShell({
  children,
  eyebrow,
  title,
  description,
  aside,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "glass sticky top-0 z-30 flex h-auto shrink-0 flex-col gap-1 rounded-none border-x-0 border-t-0 p-3 lg:h-screen lg:w-[248px] lg:border-r lg:border-b-0 lg:p-4",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-edge)]">
              <Sparkles className="size-4 text-background" />
            </span>
            <span className="truncate text-sm font-semibold tracking-tight">BoardMaster AI</span>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>

        <nav className={cn("mt-3 flex-col gap-1", open ? "flex" : "hidden lg:flex")}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className: "bg-secondary text-foreground glow-ring",
              }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-secondary/60" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden rounded-xl border border-border/60 p-3 text-xs text-muted-foreground lg:block">
          Engines run locally in your browser — minimax, alpha–beta and MCTS.
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          {aside}
        </header>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
