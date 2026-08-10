import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Segmented, Stat } from "@/routes/play.tic-tac-toe";
import {
  applyMove,
  evaluateBoard,
  initialBoard,
  legalMoves,
  mcts,
  type CBoard,
  type MCTSResult,
  type Move,
  type Side,
} from "@/lib/games/checkers";
import { recordGame } from "@/lib/stats";

export const Route = createFileRoute("/play/checkers")({
  head: () => ({
    meta: [
      { title: "Checkers AI — BoardMaster AI" },
      {
        name: "description",
        content:
          "Face a Monte Carlo Tree Search checkers engine with adjustable simulation counts and a live visualiser of nodes, rollouts and best paths.",
      },
      { property: "og:title", content: "Checkers AI — BoardMaster AI" },
      {
        property: "og:description",
        content: "MCTS checkers engine with a live thinking visualiser.",
      },
    ],
  }),
  component: Checkers,
});

const HUMAN: Side = 1;
const AI: Side = -1;

function Checkers() {
  const [board, setBoard] = useState<CBoard>(initialBoard);
  const [turn, setTurn] = useState<Side>(HUMAN);
  const [sims, setSims] = useState(600);
  const [selected, setSelected] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<MCTSResult | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const recorded = useRef(false);
  const totals = useRef({ nodes: 0, ms: 0 });

  const moves = useMemo(() => legalMoves(board, turn), [board, turn]);
  const finished = moves.length === 0;
  const winner: Side | null = finished ? ((-turn) as Side) : null;
  const options = useMemo(
    () => (selected === null ? [] : moves.filter((m) => m.from === selected)),
    [moves, selected],
  );

  const commit = (m: Move) => {
    setBoard((b) => applyMove(b, m));
    setTurn((t) => (-t) as Side);
    setSelected(null);
    setMoveCount((c) => c + 1);
  };

  useEffect(() => {
    if (finished) return;
    if (turn !== AI && !autoPlay) return;
    setThinking(true);
    const t = setTimeout(() => {
      const r = mcts(board, turn, sims);
      totals.current.nodes += r.nodesExplored;
      totals.current.ms += r.elapsedMs;
      setResult(r);
      setThinking(false);
      if (r.move) commit(r.move);
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, finished, sims, autoPlay]);

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    recordGame({
      game: "checkers",
      outcome: winner === HUMAN ? "win" : winner === AI ? "loss" : "draw",
      moves: moveCount,
      difficulty: `${sims} sims`,
      nodes: totals.current.nodes,
      decisionMs: Math.round(totals.current.ms),
    });
  }, [finished, winner, moveCount, sims]);

  const reset = () => {
    setBoard(initialBoard());
    setTurn(HUMAN);
    setSelected(null);
    setResult(null);
    setMoveCount(0);
    recorded.current = false;
    totals.current = { nodes: 0, ms: 0 };
  };

  const advantage = evaluateBoard(board, HUMAN);

  return (
    <AppShell
      eyebrow="Module 03"
      title="Checkers"
      description="Monte Carlo Tree Search with UCT selection and heuristic-guided rollouts. Captures are forced; kings move both ways."
      aside={
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          <RotateCcw className="size-4" /> New game
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <div className="flex flex-wrap items-end gap-4">
            <Segmented
              label="Simulations"
              value={String(sims)}
              onChange={(v) => setSims(Number(v))}
              options={[
                ["200", "200"],
                ["600", "600"],
                ["1500", "1500"],
                ["4000", "4000"],
              ]}
            />
            <button
              onClick={() => setAutoPlay((v) => !v)}
              aria-pressed={autoPlay}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                autoPlay ? "bg-[image:var(--gradient-edge)] text-background" : "border border-border"
              }`}
            >
              AI vs AI battle
            </button>
          </div>

          <div className="mx-auto mt-8 w-full max-w-[520px] overflow-hidden rounded-2xl border border-border glow-ring">
            <div className="grid grid-cols-8">
              {board.map((piece, i) => {
                const r = Math.floor(i / 8);
                const c = i % 8;
                const dark = (r + c) % 2 === 1;
                const target = options.find((m) => m.to === i);
                const canSelect =
                  !autoPlay && turn === HUMAN && piece !== 0 && Math.sign(piece) === HUMAN &&
                  moves.some((m) => m.from === i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (target) commit(target);
                      else if (canSelect) setSelected(selected === i ? null : i);
                    }}
                    disabled={!target && !canSelect}
                    aria-label={`Square ${String.fromCharCode(97 + c)}${8 - r}`}
                    className={`relative aspect-square ${
                      dark ? "bg-[color-mix(in_oklab,var(--primary)_26%,var(--background))]" : "bg-secondary/40"
                    }`}
                  >
                    {target && (
                      <span className="absolute inset-0 m-auto size-3.5 rounded-full bg-success/80" />
                    )}
                    <AnimatePresence>
                      {piece !== 0 && (
                        <motion.span
                          layout
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 280, damping: 20 }}
                          className={`absolute inset-[14%] grid place-items-center rounded-full text-[10px] font-bold ${
                            piece > 0
                              ? "bg-destructive text-background"
                              : "bg-accent text-background"
                          } ${selected === i ? "ring-2 ring-success" : ""} ${
                            canSelect ? "cursor-pointer" : ""
                          }`}
                        >
                          {Math.abs(piece) === 2 ? "K" : ""}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground" aria-live="polite">
            {finished
              ? winner === HUMAN
                ? "You trapped the engine — victory."
                : "The engine has no moves left for you — defeat."
              : thinking
                ? "Running simulations…"
                : turn === HUMAN
                  ? "Your move — captures are mandatory."
                  : "AI to move"}
          </p>
        </div>

        <div className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              AI thinking visualiser
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Simulations" value={(result?.simulations ?? 0).toLocaleString()} />
              <Stat label="Nodes explored" value={(result?.nodesExplored ?? 0).toLocaleString()} />
              <Stat label="AI win rate" value={`${Math.round((result?.winRate ?? 0.5) * 100)}%`} />
              <Stat label="Search time" value={`${result?.elapsedMs ?? 0} ms`} />
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Candidate moves by visits
            </p>
            <div className="mt-3 space-y-2">
              {(result?.candidates ?? []).map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-muted-foreground">
                    {square(c.move.from)}→{square(c.move.to)}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/60">
                    <motion.span
                      animate={{
                        width: `${Math.round((c.visits / (result!.candidates[0]!.visits || 1)) * 100)}%`,
                      }}
                      className={`block h-full rounded-full ${i === 0 ? "bg-[image:var(--gradient-edge)]" : "bg-muted-foreground/40"}`}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right tabular-nums">
                    {Math.round(c.winRate * 100)}%
                  </span>
                </div>
              ))}
              {!result && (
                <p className="text-xs text-muted-foreground">
                  Make a move to watch the tree search unfold.
                </p>
              )}
            </div>

            {result?.bestPath.length ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Best path discovered:{" "}
                <span className="text-accent">
                  {result.bestPath.map((m) => `${square(m.from)}→${square(m.to)}`).join("  ")}
                </span>
              </p>
            ) : null}
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Material balance
            </h2>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary/60">
              <motion.span
                animate={{ width: `${Math.max(4, Math.min(96, 50 + advantage * 4))}%` }}
                className="block h-full rounded-full bg-[image:var(--gradient-edge)]"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {advantage > 1
                ? "You hold a material edge."
                : advantage < -1
                  ? "The engine is ahead on material."
                  : "Material is level."}{" "}
              Moves played: {moveCount}.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

const square = (i: number) => `${String.fromCharCode(97 + (i % 8))}${8 - Math.floor(i / 8)}`;