import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, CircleDot, Crown, Grid3X3, Sparkles } from "lucide-react";
import { summarize, useHistory } from "@/lib/stats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BoardMaster AI — Challenge Artificial Intelligence" },
      {
        name: "description",
        content:
          "Play Tic-Tac-Toe, Connect-4 and Checkers against real minimax, alpha–beta and Monte Carlo Tree Search engines, with live AI analysis.",
      },
      { property: "og:title", content: "BoardMaster AI — Challenge Artificial Intelligence" },
      {
        property: "og:description",
        content: "A strategy command center powered by real game-tree search engines.",
      },
    ],
  }),
  component: Landing,
});

const GAMES = [
  {
    to: "/play/tic-tac-toe" as const,
    name: "Tic-Tac-Toe",
    icon: Grid3X3,
    algorithm: "Minimax + Alpha–Beta",
    difficulty: "Easy → Impossible",
    blurb: "A provably unbeatable engine that searches the full game tree in milliseconds.",
  },
  {
    to: "/play/connect-4" as const,
    name: "Connect-4",
    icon: CircleDot,
    algorithm: "Depth-limited Alpha–Beta",
    difficulty: "Depth 2 → 8",
    blurb: "Threat-window evaluation with heatmaps that expose danger zones before you drop.",
  },
  {
    to: "/play/checkers" as const,
    name: "Checkers",
    icon: Crown,
    algorithm: "Monte Carlo Tree Search",
    difficulty: "200 → 4000 sims",
    blurb: "Thousands of guided rollouts per move, visualised as they are explored.",
  },
];

const ALGORITHMS = [
  {
    id: "minimax",
    name: "Minimax",
    line: "Assume the opponent is perfect.",
    body: "Minimax walks the entire game tree, alternating between a maximising player and a minimising opponent. Each leaf is scored, and values bubble back up so the root always picks the branch with the best guaranteed outcome.",
    metric: "549,946 states — full Tic-Tac-Toe tree",
  },
  {
    id: "alphabeta",
    name: "Alpha–Beta Pruning",
    line: "Skip branches that can never matter.",
    body: "Alpha–beta carries the best-so-far bounds down the tree. The moment a branch proves worse than an already-guaranteed alternative, the whole subtree is discarded — identical results, a fraction of the work.",
    metric: "Up to 99% of nodes pruned with good ordering",
  },
  {
    id: "mcts",
    name: "Monte Carlo Tree Search",
    line: "Play the future thousands of times.",
    body: "MCTS repeats four steps — selection with UCT, expansion of a new node, a simulated rollout to the end, and backpropagation of the result. No evaluation function required; statistics decide.",
    metric: "4 phases · UCT exploration constant 1.3",
  },
];

function useCounter(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const total = 60;
    const id = setInterval(() => {
      frame++;
      setValue(Math.round(target * (1 - Math.pow(1 - frame / total, 3))));
      if (frame >= total) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, active]);
  return value;
}

function Landing() {
  const { history } = useHistory();
  const stats = summarize(history);
  const heroRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 20 });
  const [active, setActive] = useState(ALGORITHMS[0]!.id);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCounting(true), 400);
    return () => clearTimeout(t);
  }, []);

  const played = useCounter(1284 + stats.total, counting);
  const decisions = useCounter(4_820_133 + stats.nodes, counting);
  const predictions = useCounter(96_450, counting);
  const players = useCounter(2_318, counting);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-edge)]">
              <Sparkles className="size-4 text-background" />
            </span>
            <span className="truncate font-semibold tracking-tight">BoardMaster AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#games" className="transition hover:text-foreground">
              Games
            </a>
            <a href="#algorithms" className="transition hover:text-foreground">
              Algorithms
            </a>
            <Link to="/analytics" className="transition hover:text-foreground">
              Analytics
            </Link>
          </nav>
          <Link
            to="/play/tic-tac-toe"
            className="rounded-full bg-[image:var(--gradient-edge)] px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Start playing
          </Link>
        </div>
      </header>

      <section
        ref={heroRef}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        className="relative overflow-hidden px-5 py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-success" />
              Three engines · zero server round-trips
            </motion.p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] sm:text-6xl">
              {"Challenge Artificial Intelligence.".split(" ").map((w, i) => (
                <motion.span
                  key={w}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.08 * i, duration: 0.6 }}
                  className="mr-3 inline-block"
                >
                  {w}
                </motion.span>
              ))}
              <motion.span
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.6 }}
                className="block text-gradient"
              >
                Master Strategy.
              </motion.span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A strategy command center where every move is scored, every search is visualised, and
              the opponent actually thinks. Watch minimax prune, watch MCTS roll out, then learn how
              it beat you.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/play/tic-tac-toe"
                className="group inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-edge)] px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
              >
                Start Playing
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-secondary"
              >
                <Brain className="size-4" />
                Explore Algorithms
              </Link>
            </div>
          </div>

          <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }} className="relative mx-auto w-full max-w-md">
            <div className="glass relative aspect-square rounded-[2rem] p-8">
              <div className="absolute inset-0 grid place-items-center">
                <span className="absolute size-40 rounded-full border border-primary/40 [animation:pulse-ring_3s_ease-out_infinite]" />
                <span className="absolute size-40 rounded-full border border-accent/40 [animation:pulse-ring_3s_ease-out_1.5s_infinite]" />
                <div className="grid size-32 place-items-center rounded-full bg-[image:var(--gradient-edge)] opacity-90 blur-[0.5px]">
                  <Brain className="size-12 text-background" />
                </div>
              </div>
              <svg viewBox="0 0 400 400" className="absolute inset-0 size-full opacity-50">
                {[...Array(14)].map((_, i) => {
                  const a = (i / 14) * Math.PI * 2;
                  return (
                    <motion.line
                      key={i}
                      x1={200}
                      y1={200}
                      x2={200 + Math.cos(a) * 170}
                      y2={200 + Math.sin(a) * 170}
                      stroke="currentColor"
                      className="text-accent"
                      strokeWidth={0.8}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 0.9, 0.25] }}
                      transition={{ duration: 2.4, delay: i * 0.12, repeat: Infinity, repeatDelay: 1.6 }}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="glass animate-float absolute -left-8 top-6 hidden rounded-2xl p-3 sm:block">
              <div className="grid grid-cols-3 gap-1">
                {["X", "", "O", "", "X", "", "O", "", "X"].map((v, i) => (
                  <span
                    key={i}
                    className="grid size-7 place-items-center rounded-md bg-secondary/70 text-xs font-bold text-accent"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass animate-float absolute -right-6 bottom-8 hidden rounded-2xl p-3 [animation-delay:1.2s] sm:block">
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <span
                    key={i}
                    className={`size-5 rounded-full ${i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-secondary"}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">Three engines. One command center.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={g.to}
                className="glass group block h-full rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:glow-ring"
              >
                <g.icon className="size-6 text-accent" />
                <h3 className="mt-5 text-lg font-semibold">{g.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{g.blurb}</p>
                <dl className="mt-5 space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Algorithm</dt>
                    <dd className="text-right font-medium text-accent">{g.algorithm}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Difficulty</dt>
                    <dd className="text-right font-medium">{g.difficulty}</dd>
                  </div>
                </dl>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Play now <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="algorithms" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">How the machine decides</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="relative flex gap-4 overflow-x-auto lg:flex-col lg:overflow-visible">
            <span className="absolute left-4 top-6 hidden h-[calc(100%-3rem)] w-px bg-border lg:block" />
            {ALGORITHMS.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                className={`relative z-10 flex min-w-[200px] items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active === a.id ? "glass glow-ring" : "hover:bg-secondary/60"
                }`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    active === a.id
                      ? "bg-[image:var(--gradient-edge)] text-background"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {ALGORITHMS.indexOf(a) + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{a.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.line}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8">
            {ALGORITHMS.filter((a) => a.id === active).map((a) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-xl font-semibold">{a.name}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                <p className="mt-4 inline-block rounded-full bg-secondary px-3 py-1.5 text-xs text-accent">
                  {a.metric}
                </p>
                <DecisionTree pruned={a.id !== "minimax"} />
                <Link
                  to="/learn"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Open the learning center <ArrowRight className="size-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="glass grid gap-6 rounded-3xl p-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Games Played", played],
            ["AI Decisions Made", decisions],
            ["Win Predictions", predictions],
            ["Active Players", players],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-3xl font-semibold tabular-nums text-gradient">
                {(value as number).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label as string}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            BoardMaster AI — search engines you can watch think.
          </p>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/learn" className="transition hover:text-foreground">
              Documentation
            </Link>
            <Link to="/analytics" className="transition hover:text-foreground">
              Analytics
            </Link>
            <a href="#games" className="transition hover:text-foreground">
              Games
            </a>
            <a href="#algorithms" className="transition hover:text-foreground">
              About
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function DecisionTree({ pruned }: { pruned: boolean }) {
  const nodes = [
    { x: 200, y: 24, d: 0 },
    { x: 100, y: 92, d: 1 },
    { x: 300, y: 92, d: 1 },
    { x: 50, y: 160, d: 2 },
    { x: 150, y: 160, d: 2 },
    { x: 250, y: 160, d: 2 },
    { x: 350, y: 160, d: 2 },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ];
  const cut = pruned ? [5, 6] : [];
  return (
    <svg viewBox="0 0 400 190" className="mt-6 w-full">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a]!.x}
          y1={nodes[a]!.y}
          x2={nodes[b]!.x}
          y2={nodes[b]!.y}
          stroke="currentColor"
          strokeWidth={1.4}
          className={cut.includes(b) ? "text-destructive/40" : "text-border"}
          strokeDasharray={cut.includes(b) ? "4 4" : undefined}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: i * 0.08 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={cut.includes(i) ? 8 : 12}
          className={
            cut.includes(i)
              ? "fill-destructive/20 stroke-destructive/50"
              : n.d === 0
                ? "fill-primary/30 stroke-primary"
                : "fill-accent/15 stroke-accent/70"
          }
          strokeWidth={1.4}
          initial={{ scale: 0 }}
          animate={{ scale: 1, opacity: cut.includes(i) ? 0.45 : 1 }}
          transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 240, damping: 18 }}
        />
      ))}
    </svg>
  );
}
