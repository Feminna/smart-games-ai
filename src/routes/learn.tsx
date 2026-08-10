import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DecisionTree } from "@/routes/index";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Algorithm Learning Center — BoardMaster AI" },
      {
        name: "description",
        content:
          "Interactive explanations of minimax, alpha–beta pruning and Monte Carlo Tree Search with animated trees and step-by-step phases.",
      },
      { property: "og:title", content: "Algorithm Learning Center — BoardMaster AI" },
      {
        property: "og:description",
        content: "Learn minimax, alpha–beta pruning and MCTS through interactive visuals.",
      },
    ],
  }),
  component: Learn,
});

const MCTS_PHASES = [
  {
    name: "Selection",
    body: "Starting at the root, walk down the tree choosing the child with the highest UCT score — balancing exploitation of good averages against exploration of rarely visited nodes.",
  },
  {
    name: "Expansion",
    body: "When a node with untried moves is reached, add one new child to the tree representing that unexplored move.",
  },
  {
    name: "Simulation",
    body: "From the new node, play a fast rollout to the end of the game. BoardMaster uses a 70% greedy / 30% random policy so rollouts stay realistic without being slow.",
  },
  {
    name: "Backpropagation",
    body: "Push the rollout result back up the path, incrementing visit counts and win totals so future selections are better informed.",
  },
];

function Learn() {
  const [phase, setPhase] = useState(0);

  return (
    <AppShell
      eyebrow="Learning center"
      title="How the engines think"
      description="The same algorithms that power the three modules, taken apart step by step."
    >
      <div className="space-y-6">
        <section className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Minimax</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Minimax models a two-player zero-sum game as a tree. The maximising player picks the
            highest-valued child, the minimising player the lowest. Values propagate from terminal
            positions back to the root, so the chosen move is optimal <em>assuming the opponent is
            also optimal</em>. In Tic-Tac-Toe this is cheap enough to solve the game outright —
            which is why the Impossible difficulty never loses.
          </p>
          <DecisionTree pruned={false} />
        </section>

        <section className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Alpha–Beta Pruning</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Alpha is the best score the maximiser can already guarantee; beta is the best the
            minimiser can. When beta ≤ alpha, the remaining siblings cannot change the result, so the
            entire subtree is cut — shown dashed below. Identical answers, dramatically less work,
            which is what lets Connect-4 search depth 8 in the browser.
          </p>
          <DecisionTree pruned />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Naive minimax", "b^d nodes"],
              ["Random ordering", "≈ b^(3d/4)"],
              ["Perfect ordering", "≈ b^(d/2)"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 font-semibold text-accent">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Monte Carlo Tree Search</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            MCTS needs no hand-written evaluation function. It repeats four phases thousands of
            times per move; the move with the most visits wins the vote.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {MCTS_PHASES.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setPhase(i)}
                aria-pressed={phase === i}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  phase === i
                    ? "bg-[image:var(--gradient-edge)] text-background"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}. {p.name}
              </button>
            ))}
          </div>
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground"
          >
            {MCTS_PHASES[phase]!.body}
          </motion.p>

          <svg viewBox="0 0 420 200" className="mt-6 w-full max-w-2xl">
            {[
              [210, 26, 0],
              [120, 92, 1],
              [300, 92, 1],
              [80, 160, 2],
              [170, 160, 2],
              [340, 160, 2],
            ].map(([x, y, depth], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={13}
                strokeWidth={1.5}
                className={
                  depth === phase % 3
                    ? "fill-primary/40 stroke-primary"
                    : "fill-accent/10 stroke-accent/50"
                }
                animate={{ scale: depth === phase % 3 ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            ))}
            {[
              [210, 26, 120, 92],
              [210, 26, 300, 92],
              [120, 92, 80, 160],
              [120, 92, 170, 160],
              [300, 92, 340, 160],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border)" strokeWidth={1.4} />
            ))}
          </svg>
        </section>
      </div>
    </AppShell>
  );
}