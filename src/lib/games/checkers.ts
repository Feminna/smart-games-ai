export type Piece = 0 | 1 | 2 | -1 | -2; // +: red (human, bottom), -: black (AI, top); |v|=2 king
export type CBoard = Piece[];
export type Side = 1 | -1;

export const idx = (r: number, c: number) => r * 8 + c;
export const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

export interface Move {
  from: number;
  to: number;
  captures: number[];
  path: number[];
}

export function initialBoard(): CBoard {
  const b: CBoard = Array<Piece>(64).fill(0);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[idx(r, c)] = -1;
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[idx(r, c)] = 1;
  return b;
}

const dirsFor = (p: Piece): [number, number][] => {
  if (p === 2 || p === -2)
    return [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
  return p > 0
    ? [
        [-1, 1],
        [-1, -1],
      ]
    : [
        [1, 1],
        [1, -1],
      ];
};

function jumpsFrom(b: CBoard, from: number, piece: Piece, captured: number[], path: number[]): Move[] {
  const r = Math.floor(from / 8);
  const c = from % 8;
  const out: Move[] = [];
  for (const [dr, dc] of dirsFor(piece)) {
    const mr = r + dr;
    const mc = c + dc;
    const lr = r + dr * 2;
    const lc = c + dc * 2;
    if (!inside(lr, lc)) continue;
    const mid = idx(mr, mc);
    const land = idx(lr, lc);
    const target = b[mid]!;
    if (target === 0 || Math.sign(target) === Math.sign(piece)) continue;
    if (captured.includes(mid) || b[land] !== 0) continue;
    const nb = [...b];
    nb[from] = 0;
    nb[mid] = 0;
    let np: Piece = piece;
    if (piece === 1 && lr === 0) np = 2;
    if (piece === -1 && lr === 7) np = -2;
    nb[land] = np;
    const nextCaptured = [...captured, mid];
    const nextPath = [...path, land];
    const chained = np === piece ? jumpsFrom(nb, land, np, nextCaptured, nextPath) : [];
    if (chained.length) out.push(...chained);
    else out.push({ from: path[0]!, to: land, captures: nextCaptured, path: nextPath });
  }
  return out;
}

export function legalMoves(b: CBoard, side: Side): Move[] {
  const jumps: Move[] = [];
  const quiet: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = b[i]!;
    if (p === 0 || Math.sign(p) !== side) continue;
    jumps.push(...jumpsFrom(b, i, p, [], [i]));
    const r = Math.floor(i / 8);
    const c = i % 8;
    for (const [dr, dc] of dirsFor(p)) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(nr, nc)) continue;
      const t = idx(nr, nc);
      if (b[t] === 0) quiet.push({ from: i, to: t, captures: [], path: [i, t] });
    }
  }
  return jumps.length ? jumps : quiet;
}

export function applyMove(b: CBoard, m: Move): CBoard {
  const nb = [...b];
  const piece = nb[m.from]!;
  nb[m.from] = 0;
  for (const c of m.captures) nb[c] = 0;
  let np: Piece = piece;
  const row = Math.floor(m.to / 8);
  if (piece === 1 && row === 0) np = 2;
  if (piece === -1 && row === 7) np = -2;
  nb[m.to] = np;
  return nb;
}

export function evaluateBoard(b: CBoard, side: Side): number {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = b[i]!;
    if (!p) continue;
    const row = Math.floor(i / 8);
    const col = i % 8;
    const advance = p > 0 ? 7 - row : row;
    const value = (Math.abs(p) === 2 ? 5 : 3) + advance * 0.12 + (col > 1 && col < 6 ? 0.15 : 0);
    score += Math.sign(p) * value;
  }
  return score * side;
}

export const winnerOf = (b: CBoard, toMove: Side): Side | null =>
  legalMoves(b, toMove).length === 0 ? ((-toMove) as Side) : null;

interface Node {
  board: CBoard;
  side: Side;
  move: Move | null;
  parent: Node | null;
  children: Node[];
  untried: Move[];
  visits: number;
  wins: number;
}

const makeNode = (board: CBoard, side: Side, move: Move | null, parent: Node | null): Node => ({
  board,
  side,
  move,
  parent,
  children: [],
  untried: legalMoves(board, side),
  visits: 0,
  wins: 0,
});

export interface MCTSResult {
  move: Move | null;
  simulations: number;
  nodesExplored: number;
  winRate: number;
  bestPath: Move[];
  candidates: { move: Move; visits: number; winRate: number }[];
  elapsedMs: number;
}

/** Monte Carlo Tree Search with a heuristic-guided rollout policy. */
export function mcts(board: CBoard, side: Side, simulations: number): MCTSResult {
  const started = Date.now();
  const root = makeNode(board, side, null, null);
  if (!root.untried.length)
    return { move: null, simulations: 0, nodesExplored: 0, winRate: 0, bestPath: [], candidates: [], elapsedMs: 0 };
  let nodesExplored = 1;

  for (let s = 0; s < simulations; s++) {
    let node = root;
    // Selection
    while (!node.untried.length && node.children.length) {
      let best = node.children[0]!;
      let bestVal = -Infinity;
      for (const child of node.children) {
        const exploit = child.wins / (child.visits || 1);
        const explore = Math.sqrt((2 * Math.log(node.visits + 1)) / (child.visits || 1));
        const val = exploit + 1.3 * explore;
        if (val > bestVal) {
          bestVal = val;
          best = child;
        }
      }
      node = best;
    }
    // Expansion
    if (node.untried.length) {
      const m = node.untried.splice(Math.floor(Math.random() * node.untried.length), 1)[0]!;
      const nb = applyMove(node.board, m);
      node = makeNode(nb, (-node.side) as Side, m, node);
      nodesExplored++;
      node.parent!.children.push(node);
    }
    // Simulation (heuristic rollout)
    let sb = node.board;
    let turn = node.side;
    let result = 0;
    for (let ply = 0; ply < 60; ply++) {
      const ms = legalMoves(sb, turn);
      if (!ms.length) {
        result = -turn === side ? 1 : 0;
        break;
      }
      let pick = ms[Math.floor(Math.random() * ms.length)]!;
      if (Math.random() < 0.7) {
        let bestScore = -Infinity;
        for (const m of ms) {
          const sc = evaluateBoard(applyMove(sb, m), turn);
          if (sc > bestScore) {
            bestScore = sc;
            pick = m;
          }
        }
      }
      sb = applyMove(sb, pick);
      turn = (-turn) as Side;
      if (ply === 59) {
        const e = evaluateBoard(sb, side);
        result = e > 0.5 ? 1 : e < -0.5 ? 0 : 0.5;
      }
    }
    // Backpropagation
    let cur: Node | null = node;
    while (cur) {
      cur.visits++;
      cur.wins += cur.side === side ? 1 - result : result;
      cur = cur.parent;
    }
  }

  const candidates = root.children
    .map((c) => ({ move: c.move!, visits: c.visits, winRate: c.visits ? c.wins / c.visits : 0 }))
    .sort((a, b) => b.visits - a.visits);

  const bestChild = root.children.reduce<Node | null>(
    (acc, c) => (!acc || c.visits > acc.visits ? c : acc),
    null,
  );

  const bestPath: Move[] = [];
  let walk = bestChild;
  while (walk && bestPath.length < 5) {
    if (walk.move) bestPath.push(walk.move);
    walk = walk.children.reduce<Node | null>((acc, c) => (!acc || c.visits > acc.visits ? c : acc), null);
  }

  return {
    move: bestChild?.move ?? root.untried[0] ?? null,
    simulations,
    nodesExplored,
    winRate: bestChild && bestChild.visits ? 1 - bestChild.wins / bestChild.visits : 0.5,
    bestPath,
    candidates: candidates.slice(0, 6),
    elapsedMs: Date.now() - started,
  };
}