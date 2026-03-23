export const W = 800;
export const H = 500;
export const YARD = 10;

export const PLAYER_CFG: Record<string, { color: string; stroke: string; label: string }> = {
  LT: { color: '#2563eb', stroke: '#1e40af', label: 'LT' },
  LG: { color: '#2563eb', stroke: '#1e40af', label: 'LG' },
  C:  { color: '#2563eb', stroke: '#1e40af', label: 'C' },
  RG: { color: '#2563eb', stroke: '#1e40af', label: 'RG' },
  RT: { color: '#2563eb', stroke: '#1e40af', label: 'RT' },
  QB: { color: '#059669', stroke: '#047857', label: 'QB' },
  WR: { color: '#d97706', stroke: '#b45309', label: 'WR' },
  RB: { color: '#ea580c', stroke: '#c2410c', label: 'RB' },
  TE: { color: '#7c3aed', stroke: '#6d28d9', label: 'TE' },
  FB: { color: '#db2777', stroke: '#be185d', label: 'FB' },
};

export const OL_TYPES = ['LT', 'LG', 'C', 'RG', 'RT'];

export const ROUTE_TREE: Record<string, [number, number][]> = {
  'Go/Fly':       [[0, -25 * YARD]],
  'Slant':        [[0, -3 * YARD], [-6 * YARD, -12 * YARD]],
  'Out':          [[0, -8 * YARD], [8 * YARD, -8 * YARD]],
  'In (Dig)':     [[0, -8 * YARD], [-8 * YARD, -8 * YARD]],
  'Post':         [[0, -8 * YARD], [-6 * YARD, -20 * YARD]],
  'Corner':       [[0, -8 * YARD], [6 * YARD, -20 * YARD]],
  'Curl/Hook':    [[0, -12 * YARD], [0, -9 * YARD]],
  'Comeback':     [[0, -14 * YARD], [-2 * YARD, -10 * YARD]],
  'Crossing':     [[-14 * YARD, -3 * YARD]],
  'Flat/Bubble':  [[8 * YARD, 2 * YARD]],
  'Wheel':        [[8 * YARD, 3 * YARD], [6 * YARD, -14 * YARD]],
  'Screen':       [[-2 * YARD, 4 * YARD], [8 * YARD, 4 * YARD]],
  'Hitch':        [[0, -5 * YARD], [0, -3.5 * YARD]],
};

export type PlayerType = 'LT' | 'LG' | 'C' | 'RG' | 'RT' | 'QB' | 'WR' | 'RB' | 'TE' | 'FB';

export interface PlayPlayer {
  id: string;
  type: PlayerType;
  x: number;
  y: number;
}

export interface PlayRoute {
  playerId: string;
  points: [number, number][];
}

export interface PlayData {
  losY: number;
  players: PlayPlayer[];
  routes: PlayRoute[];
}

export interface SavedPlay {
  id: number;
  name: string;
  data: PlayData;
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

let _nid = 1;
export const genId = () => `p${Date.now()}_${_nid++}`;

export function makeDefaultPlay(): PlayData {
  const losY = 280;
  return {
    losY,
    players: [
      { id: 'lt',  type: 'LT', x: 320, y: losY },
      { id: 'lg',  type: 'LG', x: 360, y: losY },
      { id: 'c',   type: 'C',  x: 400, y: losY },
      { id: 'rg',  type: 'RG', x: 440, y: losY },
      { id: 'rt',  type: 'RT', x: 480, y: losY },
      { id: 'qb',  type: 'QB', x: 400, y: losY + 3 * YARD },
      { id: 'wr1', type: 'WR', x: 80,  y: losY },
      { id: 'wr2', type: 'WR', x: 720, y: losY },
      { id: 'rb',  type: 'RB', x: 400, y: losY + 6 * YARD },
    ],
    routes: [],
  };
}

export function applyRouteTree(player: PlayPlayer, routeName: string): [number, number][] {
  const offsets = ROUTE_TREE[routeName];
  if (!offsets) return [];
  const sideSign = player.x >= W / 2 ? 1 : -1;
  const pts: [number, number][] = [];
  let cx = player.x, cy = player.y;
  for (const [dx, dy] of offsets) {
    cx = clamp(cx + dx * sideSign, 5, W - 5);
    cy = clamp(cy + dy, 5, H - 5);
    pts.push([cx, cy]);
  }
  return pts;
}

export function makeArrowPolygon(from: [number, number], to: [number, number]): string {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return '';
  const angle = Math.atan2(dy, dx);
  const sz = 11;
  const sp = 0.45;
  const p1x = to[0] - sz * Math.cos(angle - sp);
  const p1y = to[1] - sz * Math.sin(angle - sp);
  const p2x = to[0] - sz * Math.cos(angle + sp);
  const p2y = to[1] - sz * Math.sin(angle + sp);
  return `${to[0]},${to[1]} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`;
}
