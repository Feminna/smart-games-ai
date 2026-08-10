export type Cell = "X" | "O" | null;
export type Board = Cell[];

export const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function winnerOf(b: Board): { player: Cell; line: number[] | null } {
  for (const line of LINES) {
    const [a, c, d] = line as [number, number, number];
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
  }
  return { player: null, line: null };
}

export const isFull = (b: Board) => b.every((c) => c !== null);
export const moves = (b: Board) =>
  b.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);

export interface Analysis {
  best: number;
  scores: Record<number, number>;
  nodes: number;
  pruned: number;
  depthReached: number;
}

/** Minimax with alpha-beta pruning. Returns instrumented analysis. */
export function analyze(board: Board, player: "X" | "O"): Analysis {
  let nodes = 0;
  let pruned = 0;
  let depthReached = 0;
  const opponent = player === "X" ? "O" : "X";

  function search(b: Board, turn: "X" | "O", depth: number, a: number, beta: number): number {
    nodes++;
    depthReached = Math.max(depthReached, depth);
    const w = winnerOf(b).player;
    if (w === player) return 10 - depth;
    if (w === opponent) return depth - 10;
    if (isFull(b)) return 0;

    let alpha = a;
    if (turn === player) {
      let best = -Infinity;
      for (const m of moves(b)) {
        b[m] = turn;
        best = Math.max(best, search(b, opponent, depth + 1, alpha, beta));
        b[m] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) {
          pruned++;
          break;
        }
      }
      return best;
    }
    let best = Infinity;
    let bt = beta;
    for (const m of moves(b)) {
      b[m] = turn;
      best = Math.min(best, search(b, player, depth + 1, alpha, bt));
      b[m] = null;
      bt = Math.min(bt, best);
      if (bt <= alpha) {
        pruned++;
        break;
      }
    }
    return best;
  }

  const scores: Record<number, number> = {};
  let best = -1;
  let bestScore = -Infinity;
  const work = [...board];
  for (const m of moves(work)) {
    work[m] = player;
    const s = search(work, opponent, 1, -Infinity, Infinity);
    work[m] = null;
    scores[m] = s;
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return { best, scores, nodes, pruned, depthReached };
}

export type Difficulty = "easy" | "medium" | "impossible";

export function chooseMove(board: Board, player: "X" | "O", difficulty: Difficulty) {
  const analysis = analyze(board, player);
  const options = moves(board);
  if (!options.length) return { move: -1, analysis };
  if (difficulty === "impossible") return { move: analysis.best, analysis };
  const randomness = difficulty === "easy" ? 0.75 : 0.28;
  if (Math.random() < randomness) {
    const pick = options[Math.floor(Math.random() * options.length)]!;
    return { move: pick, analysis };
  }
  return { move: analysis.best, analysis };
}