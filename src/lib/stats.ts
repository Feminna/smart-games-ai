import { useCallback, useEffect, useState } from "react";

export type GameKey = "tic-tac-toe" | "connect-4" | "checkers";
export type Outcome = "win" | "loss" | "draw";

export interface GameRecord {
  id: string;
  game: GameKey;
  outcome: Outcome;
  moves: number;
  difficulty: string;
  nodes: number;
  decisionMs: number;
  at: number;
}

const KEY = "boardmaster.history.v1";

function read(): GameRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as GameRecord[];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function recordGame(record: Omit<GameRecord, "id" | "at">) {
  if (typeof window === "undefined") return;
  const next = [{ ...record, id: crypto.randomUUID(), at: Date.now() }, ...read()].slice(0, 400);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function useHistory() {
  const [history, setHistory] = useState<GameRecord[]>([]);
  useEffect(() => {
    const sync = () => setHistory(read());
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  const clear = useCallback(() => {
    window.localStorage.removeItem(KEY);
    emit();
  }, []);
  return { history, clear };
}

export const GAME_LABEL: Record<GameKey, string> = {
  "tic-tac-toe": "Tic-Tac-Toe",
  "connect-4": "Connect-4",
  checkers: "Checkers",
};

export function summarize(history: GameRecord[]) {
  const wins = history.filter((h) => h.outcome === "win").length;
  const losses = history.filter((h) => h.outcome === "loss").length;
  const draws = history.filter((h) => h.outcome === "draw").length;
  const nodes = history.reduce((a, h) => a + h.nodes, 0);
  const avgDecision = history.length
    ? Math.round(history.reduce((a, h) => a + h.decisionMs, 0) / history.length)
    : 0;
  const winRate = history.length ? Math.round((wins / history.length) * 100) : 0;
  const byGame = (["tic-tac-toe", "connect-4", "checkers"] as GameKey[]).map((g) => {
    const rows = history.filter((h) => h.game === g);
    return {
      game: g,
      label: GAME_LABEL[g],
      played: rows.length,
      wins: rows.filter((r) => r.outcome === "win").length,
      winRate: rows.length
        ? Math.round((rows.filter((r) => r.outcome === "win").length / rows.length) * 100)
        : 0,
    };
  });
  const favorite = [...byGame].sort((a, b) => b.played - a.played)[0];
  const level = Math.max(1, Math.floor(history.length / 3) + 1);
  return { wins, losses, draws, nodes, avgDecision, winRate, byGame, favorite, level, total: history.length };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export function achievements(history: GameRecord[]): Achievement[] {
  const s = summarize(history);
  const winsIn = (g: GameKey) => history.filter((h) => h.game === g && h.outcome === "win").length;
  return [
    { id: "first", name: "First Victory", description: "Win your first match.", unlocked: s.wins >= 1 },
    {
      id: "challenger",
      name: "AI Challenger",
      description: "Play 10 matches against the engine.",
      unlocked: s.total >= 10,
    },
    {
      id: "c4",
      name: "Connect-4 Master",
      description: "Win 3 Connect-4 games.",
      unlocked: winsIn("connect-4") >= 3,
    },
    {
      id: "checkers",
      name: "Checkers Strategist",
      description: "Beat the MCTS engine once.",
      unlocked: winsIn("checkers") >= 1,
    },
    {
      id: "gm",
      name: "Grandmaster",
      description: "Hold a 60%+ win rate over 15 games.",
      unlocked: s.total >= 15 && s.winRate >= 60,
    },
  ];
}