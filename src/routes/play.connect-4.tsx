import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Segmented, Stat } from "@/routes/play.tic-tac-toe";
import {
  COLS,
  clone,
  drop,
  emptyBoard,
  findWin,
  heatmap,
  solve,
  validColumns,
  type C4Board,
  type Disc,
} from "@/lib/games/connect4";
import { recordGame } from "@/lib/stats";

export const Route = createFileRoute("/play/connect-4")({
  head: () => ({
    meta: [
      { title: "Connect-4 AI — BoardMaster AI" },
      {
        name: "description",
        content:
          "Drop discs against a depth-limited alpha–beta Connect-4 engine with move reasoning, win probability and a live threat heatmap.",
      },
      { property: "og:title", content: "Connect-4 AI — BoardMaster AI" },
      {
        property: "og:description",
        content: "Alpha–beta Connect-4 engine with threat heatmaps and win probability.",
      },
    ],
  }),
  component: Connect4,
});

const HUMAN: Disc = "R";
const AI: Disc = "Y";

function Connect4() {
  const [board, setBoard] = useState<C4Board>(emptyBoard);
  const [turn, setTurn] = useState<Disc>(HUMAN);
  const [depth, setDepth] = useState(5);
  const [showHeat, setShowHeat] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [moves, setMoves] = useState(0);
  const recorded = useRef(false);
  const totals = useRef({ nodes: 0, ms: 0 });

  const win = findWin(board);
  const open = validColumns(board);
  const finished = Boolean(win) || open.length === 0;

  const advice = useMemo(
    () => (finished ? null : solve(board, turn, Math.min(depth, 6))),
    [board, turn, depth, finished],
  );
  const heat = useMemo(() => (showHeat ? heatmap(board, turn) : null), [board, turn, showHeat]);

  const place = (col: number, disc: Disc) => {
    setBoard((prev) => {
      const next = clone(prev);
      if (drop(next, col, disc) < 0) return prev;
      return next;
    });
    setMoves((m) => m + 1);
    setTurn(disc === "R" ? "Y" : "R");
  };

  useEffect(() => {
    if (finished || turn !== AI) return;
    setThinking(true);
    const t = setTimeout(() => {
      const result = solve(board, AI, depth);
      totals.current.nodes += result.nodes;
      totals.current.ms += result.elapsedMs;
      setThinking(false);
      if (result.best >= 0) place(result.best, AI);
    }, 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, finished, depth]);

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    recordGame({
      game: "connect-4",
      outcome: win?.player === HUMAN ? "win" : win?.player === AI ? "loss" : "draw",
      moves,
      difficulty: `depth ${depth}`,
      nodes: totals.current.nodes,
      decisionMs: Math.round(totals.current.ms),
    });
  }, [finished, win, moves, depth]);

  const reset = () => {
    setBoard(emptyBoard());
    setTurn(HUMAN);
    setMoves(0);
    recorded.current = false;
    totals.current = { nodes: 0, ms: 0 };
  };

  return (
    <AppShell
      eyebrow="Module 02"
      title="Connect-4"
      description="Depth-limited minimax with alpha–beta pruning, threat-window evaluation and centre-first move ordering."
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
              label="Search depth"
              value={String(depth)}
              onChange={(v) => setDepth(Number(v))}
              options={[
                ["2", "2"],
                ["4", "4"],
                ["5", "5"],
                ["6", "6"],
                ["8", "8"],
              ]}
            />
            <button
              onClick={() => setShowHeat((v) => !v)}
              aria-pressed={showHeat}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                showHeat ? "bg-[image:var(--gradient-edge)] text-background" : "border border-border"
              }`}
            >
              <Flame className="size-3.5" /> Heatmap
            </button>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="mx-auto w-full max-w-[560px] rounded-3xl bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] p-3 glow-ring">
              <div className="grid grid-cols-7 gap-2">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const isWinner = win?.cells.some(([wr, wc]) => wr === r && wc === c);
                    const h = heat?.[r]?.[c] ?? null;
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => !finished && turn === HUMAN && open.includes(c) && place(c, HUMAN)}
                        disabled={finished || turn !== HUMAN || !open.includes(c)}
                        aria-label={`Column ${c + 1}, row ${r + 1}`}
                        className="group relative aspect-square rounded-full bg-background/60 transition"
                      >
                        {h !== null && !cell && (
                          <span
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `color-mix(in oklab, var(--destructive) ${Math.round(h * 70)}%, transparent)`,
                            }}
                          />
                        )}
                        <AnimatePresence>
                          {cell && (
                            <motion.span
                              initial={{ y: -260, scale: 0.85 }}
                              animate={{ y: 0, scale: 1 }}
                              transition={{ type: "spring", stiffness: 260, damping: 18 }}
                              className={`absolute inset-0 rounded-full ${
                                cell === "R" ? "bg-destructive" : "bg-accent"
                              } ${isWinner ? "ring-4 ring-success ring-offset-0" : ""}`}
                            />
                          )}
                        </AnimatePresence>
                        {!cell && !finished && turn === HUMAN && open.includes(c) && (
                          <span className="absolute inset-1 rounded-full opacity-0 transition group-hover:opacity-30 group-hover:bg-destructive" />
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground" aria-live="polite">
            {finished
              ? win
                ? win.player === HUMAN
                  ? "You connected four — victory."
                  : "The engine connected four."
                : "Board full — draw."
              : thinking
                ? "Engine is pruning the search tree…"
                : turn === HUMAN
                  ? "Your move — pick a column."
                  : "AI to move"}
          </p>
        </div>

        <div className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Recommendation
            </h2>
            {advice ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stat label="Best column" value={`#${advice.best + 1}`} />
                  <Stat label="Win probability" value={`${advice.winProbability}%`} />
                  <Stat label="Nodes" value={advice.nodes.toLocaleString()} />
                  <Stat label="Cutoffs" value={advice.pruned.toLocaleString()} />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{advice.reasoning}</p>
                <div className="mt-5 space-y-1.5">
                  {Array.from({ length: COLS }, (_, c) => {
                    const s = advice.scores[c];
                    const pct =
                      s === undefined ? 0 : Math.max(4, Math.min(100, 50 + Math.atan(s / 300) * 60));
                    return (
                      <div key={c} className="flex items-center gap-2 text-xs">
                        <span className="w-6 shrink-0 text-muted-foreground">{c + 1}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/60">
                          <motion.span
                            animate={{ width: `${pct}%` }}
                            className={`block h-full rounded-full ${
                              c === advice.best ? "bg-[image:var(--gradient-edge)]" : "bg-muted-foreground/50"
                            }`}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Match finished.</p>
            )}
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Game analysis</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Moves played" value={String(moves)} />
              <Stat label="Engine time" value={`${Math.round(totals.current.ms)} ms`} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Enable the heatmap to see which landing squares create winning opportunities and which
              hand the engine a threat.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}