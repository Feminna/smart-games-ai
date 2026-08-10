import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DecisionTree } from "@/routes/index";
import {
  analyze,
  chooseMove,
  isFull,
  winnerOf,
  type Board,
  type Difficulty,
} from "@/lib/games/tictactoe";
import { recordGame } from "@/lib/stats";

export const Route = createFileRoute("/play/tic-tac-toe")({
  head: () => ({
    meta: [
      { title: "Tic-Tac-Toe AI — BoardMaster AI" },
      {
        name: "description",
        content:
          "Play an unbeatable Tic-Tac-Toe engine built on minimax with alpha–beta pruning, with live board evaluation and move scoring.",
      },
      { property: "og:title", content: "Tic-Tac-Toe AI — BoardMaster AI" },
      {
        property: "og:description",
        content: "Unbeatable minimax engine with live evaluation and decision-tree visuals.",
      },
    ],
  }),
  component: TicTacToe,
});

type Mode = "hva" | "ava" | "hvh";
const EMPTY: Board = Array<null>(9).fill(null);

function TicTacToe() {
  const [board, setBoard] = useState<Board>(EMPTY);
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [mode, setMode] = useState<Mode>("hva");
  const [difficulty, setDifficulty] = useState<Difficulty>("impossible");
  const [thinking, setThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const recorded = useRef(false);
  const totals = useRef({ nodes: 0, ms: 0 });

  const { player: winner, line } = winnerOf(board);
  const finished = Boolean(winner) || isFull(board);
  const analysis = useMemo(() => (finished ? null : analyze(board, turn)), [board, turn, finished]);

  const aiTurn =
    !finished &&
    ((mode === "hva" && turn === "O") || mode === "ava");

  const play = useCallback(
    (i: number) => {
      setBoard((prev) => {
        if (prev[i] || winnerOf(prev).player) return prev;
        const next = [...prev];
        next[i] = turn;
        return next;
      });
      setTurn((t) => (t === "X" ? "O" : "X"));
      setMoveCount((m) => m + 1);
    },
    [turn],
  );

  useEffect(() => {
    if (!aiTurn) return;
    setThinking(true);
    const t = setTimeout(() => {
      const started = performance.now();
      const { move, analysis: a } = chooseMove(board, turn, difficulty);
      totals.current.nodes += a.nodes;
      totals.current.ms += performance.now() - started;
      setThinking(false);
      if (move >= 0) play(move);
    }, 520);
    return () => clearTimeout(t);
  }, [aiTurn, board, turn, difficulty, play]);

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    if (mode !== "hva") return;
    recordGame({
      game: "tic-tac-toe",
      outcome: winner === "X" ? "win" : winner === "O" ? "loss" : "draw",
      moves: moveCount,
      difficulty,
      nodes: totals.current.nodes,
      decisionMs: Math.round(totals.current.ms),
    });
  }, [finished, winner, mode, moveCount, difficulty]);

  const reset = () => {
    setBoard(EMPTY);
    setTurn("X");
    setMoveCount(0);
    recorded.current = false;
    totals.current = { nodes: 0, ms: 0 };
  };

  const evaluation = analysis ? (analysis.scores[analysis.best] ?? 0) : 0;
  const strategyScore = Math.max(
    0,
    Math.min(100, Math.round(100 - moveCount * 4 + (winner === "X" ? 30 : winner === "O" ? -20 : 0))),
  );

  return (
    <AppShell
      eyebrow="Module 01"
      title="Tic-Tac-Toe"
      description="Minimax with alpha–beta pruning. On Impossible the engine cannot be beaten — only drawn."
      aside={
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          <RotateCcw className="size-4" /> New game
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap gap-4">
            <Segmented
              label="Mode"
              value={mode}
              onChange={(v) => {
                setMode(v as Mode);
                reset();
              }}
              options={[
                ["hva", "Human vs AI"],
                ["ava", "AI vs AI"],
                ["hvh", "Human vs Human"],
              ]}
            />
            <Segmented
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as Difficulty)}
              options={[
                ["easy", "Easy"],
                ["medium", "Medium"],
                ["impossible", "Impossible"],
              ]}
            />
          </div>

          <div className="mx-auto mt-8 grid aspect-square w-full max-w-[420px] grid-cols-3 gap-3">
            {board.map((cell, i) => {
              const winning = line?.includes(i);
              return (
                <motion.button
                  key={i}
                  whileHover={!cell && !finished ? { scale: 1.03 } : undefined}
                  whileTap={!cell && !finished ? { scale: 0.96 } : undefined}
                  onClick={() => !aiTurn && !finished && !cell && play(i)}
                  disabled={Boolean(cell) || finished || aiTurn}
                  aria-label={`Square ${i + 1}${cell ? `, ${cell}` : ", empty"}`}
                  className={`glass-soft grid place-items-center rounded-2xl text-4xl font-bold transition-colors sm:text-5xl ${
                    winning ? "bg-success/20 text-success glow-ring" : cell === "X" ? "text-accent" : "text-primary"
                  } ${!cell && !finished && !aiTurn ? "hover:bg-secondary/70" : ""}`}
                >
                  <AnimatePresence>
                    {cell && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                      >
                        {cell}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground" aria-live="polite">
            {finished
              ? winner
                ? `${winner} wins in ${moveCount} moves`
                : "Draw — perfect play on both sides"
              : thinking
                ? "AI is searching the game tree…"
                : `${turn} to move`}
          </p>
        </div>

        <div className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              AI analysis
            </h2>
            {analysis ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Evaluation" value={evaluation > 0 ? `+${evaluation}` : `${evaluation}`} />
                  <Stat label="Best move" value={`Square ${analysis.best + 1}`} />
                  <Stat label="Nodes searched" value={analysis.nodes.toLocaleString()} />
                  <Stat label="Branches pruned" value={analysis.pruned.toLocaleString()} />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {evaluation > 0
                    ? `${turn} has a forced win from here.`
                    : evaluation < 0
                      ? `${turn} is losing against perfect play — best is to delay.`
                      : "Position is balanced; every best line ends in a draw."}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-1.5">
                  {board.map((c, i) => (
                    <span
                      key={i}
                      className={`grid h-9 place-items-center rounded-lg text-xs font-semibold ${
                        c
                          ? "bg-secondary/40 text-muted-foreground"
                          : i === analysis.best
                            ? "bg-success/25 text-success"
                            : (analysis.scores[i] ?? 0) >= 0
                              ? "bg-secondary text-foreground"
                              : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {c ?? (analysis.scores[i] ?? 0)}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Game complete — start a new match.</p>
            )}
            <DecisionTree pruned={difficulty === "impossible"} />
          </section>

          <AnimatePresence>
            {finished && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass glow-ring rounded-3xl p-6"
              >
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Match summary
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Winner" value={winner ?? "Draw"} />
                  <Stat label="Moves" value={String(moveCount)} />
                  <Stat label="Strategy score" value={`${strategyScore}/100`} />
                  <Stat label="AI time" value={`${Math.round(totals.current.ms)} ms`} />
                </div>
                <button
                  onClick={reset}
                  className="mt-5 w-full rounded-full bg-[image:var(--gradient-edge)] px-4 py-2.5 text-sm font-semibold text-background"
                >
                  Replay
                </button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

export function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="inline-flex flex-wrap gap-1 rounded-full bg-secondary/60 p-1">
        {options.map(([v, l]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              value === v
                ? "bg-[image:var(--gradient-edge)] text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}