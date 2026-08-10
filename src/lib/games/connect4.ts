export const COLS = 7;
export const ROWS = 6;
export type Disc = "R" | "Y" | null;
export type C4Board = Disc[][]; // [row][col], row 0 = top

export const emptyBoard = (): C4Board =>
  Array.from({ length: ROWS }, () => Array<Disc>(COLS).fill(null));

export const clone = (b: C4Board): C4Board => b.map((r) => [...r]);

export function validColumns(b: C4Board): number[] {
  const out: number[] = [];
  for (let c = 0; c < COLS; c++) if (b[0]![c] === null) out.push(c);
  return out;
}

export function dropRow(b: C4Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (b[r]![col] === null) return r;
  return -1;
}

export function drop(b: C4Board, col: number, disc: Disc): number {
  const r = dropRow(b, col);
  if (r >= 0) b[r]![col] = disc;
  return r;
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export function findWin(b: C4Board): { player: Disc; cells: [number, number][] } | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = b[r]![c];
      if (!p) continue;
      for (const [dr, dc] of DIRS) {
        const cells: [number, number][] = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr]![nc] !== p) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return { player: p, cells };
      }
    }
  }
  return null;
}

export const isDraw = (b: C4Board) => validColumns(b).length === 0 && !findWin(b);

function windowScore(cells: Disc[], me: Disc): number {
  const opp: Disc = me === "R" ? "Y" : "R";
  const mine = cells.filter((c) => c === me).length;
  const theirs = cells.filter((c) => c === opp).length;
  const empty = cells.filter((c) => c === null).length;
  if (mine && theirs) return 0;
  if (mine === 4) return 100000;
  if (mine === 3 && empty === 1) return 120;
  if (mine === 2 && empty === 2) return 18;
  if (theirs === 4) return -100000;
  if (theirs === 3 && empty === 1) return -160;
  if (theirs === 2 && empty === 2) return -20;
  return 0;
}

export function evaluate(b: C4Board, me: Disc): number {
  let score = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (b[r]![c] === me) score += [1, 2, 4, 6, 4, 2, 1][c]!;
      for (const [dr, dc] of DIRS) {
        const cells: Disc[] = [];
        for (let k = 0; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
            cells.length = 0;
            break;
          }
          cells.push(b[nr]![nc]!);
        }
        if (cells.length === 4) score += windowScore(cells, me);
      }
    }
  return score;
}

export interface C4Analysis {
  best: number;
  scores: Record<number, number>;
  nodes: number;
  pruned: number;
  winProbability: number;
  reasoning: string;
  elapsedMs: number;
}

export function solve(board: C4Board, me: Disc, depth: number): C4Analysis {
  const started = Date.now();
  let nodes = 0;
  let pruned = 0;
  const opp: Disc = me === "R" ? "Y" : "R";

  function search(b: C4Board, d: number, alpha: number, beta: number, maximizing: boolean): number {
    nodes++;
    const win = findWin(b);
    if (win) return win.player === me ? 1_000_000 - (depth - d) : -1_000_000 + (depth - d);
    const cols = validColumns(b);
    if (!cols.length || d === 0) return evaluate(b, me);
    const ordered = [...cols].sort((a, z) => Math.abs(3 - a) - Math.abs(3 - z));
    let a = alpha;
    let bt = beta;
    if (maximizing) {
      let best = -Infinity;
      for (const c of ordered) {
        const r = drop(b, c, me);
        best = Math.max(best, search(b, d - 1, a, bt, false));
        b[r]![c] = null;
        a = Math.max(a, best);
        if (bt <= a) {
          pruned++;
          break;
        }
      }
      return best;
    }
    let best = Infinity;
    for (const c of ordered) {
      const r = drop(b, c, opp);
      best = Math.min(best, search(b, d - 1, a, bt, true));
      b[r]![c] = null;
      bt = Math.min(bt, best);
      if (bt <= a) {
        pruned++;
        break;
      }
    }
    return best;
  }

  const work = clone(board);
  const scores: Record<number, number> = {};
  let best = -1;
  let bestScore = -Infinity;
  for (const c of validColumns(work)) {
    const r = drop(work, c, me);
    const s = search(work, depth - 1, -Infinity, Infinity, false);
    work[r]![c] = null;
    scores[c] = s;
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }

  const winProbability = Math.max(2, Math.min(98, Math.round(50 + Math.atan(bestScore / 400) * (100 / Math.PI) * 2)));
  const reasoning =
    bestScore > 500_000
      ? "Forced win detected on this line."
      : bestScore < -500_000
        ? "All lines lose against perfect play — playing the longest defence."
        : bestScore > 100
          ? "Builds a double threat while keeping the centre column."
          : bestScore < -100
            ? "Blocks the opponent's imminent three-in-a-row."
            : "Maximises centre control and future connection windows.";

  return { best, scores, nodes, pruned, winProbability, reasoning, elapsedMs: Date.now() - started };
}

/** Threat heatmap: value of each playable landing square for the given player. */
export function heatmap(board: C4Board, me: Disc): (number | null)[][] {
  const grid: (number | null)[][] = Array.from({ length: ROWS }, () =>
    Array<number | null>(COLS).fill(null),
  );
  const base = evaluate(board, me);
  for (const c of validColumns(board)) {
    const b = clone(board);
    const r = drop(b, c, me);
    grid[r]![c] = findWin(b) ? 1 : Math.max(0, Math.min(1, (evaluate(b, me) - base + 120) / 260));
  }
  return grid;
}