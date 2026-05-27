export const W = 800;
export const H = 500;
export const YARD = 10;

export const PLAYER_CFG: Record<string, { color: string; stroke: string; label: string; shape?: 'square' }> = {
  // Offense
  LT:  { color: '#0ea5e9', stroke: '#0284c7', label: 'LT',  shape: 'square' },
  LG:  { color: '#0ea5e9', stroke: '#0284c7', label: 'LG',  shape: 'square' },
  C:   { color: '#0ea5e9', stroke: '#0284c7', label: 'C',   shape: 'square' },
  RG:  { color: '#0ea5e9', stroke: '#0284c7', label: 'RG',  shape: 'square' },
  RT:  { color: '#0ea5e9', stroke: '#0284c7', label: 'RT',  shape: 'square' },
  QB:  { color: '#22d3ee', stroke: '#06b6d4', label: 'QB' },
  WR:  { color: '#f59e0b', stroke: '#d97706', label: 'WR' },
  RB:  { color: '#ef4444', stroke: '#dc2626', label: 'RB' },
  TE:  { color: '#a855f7', stroke: '#9333ea', label: 'TE' },
  FB:  { color: '#ec4899', stroke: '#db2777', label: 'FB' },
  // Defense
  DE:  { color: '#f87171', stroke: '#dc2626', label: 'DE',  shape: 'square' },
  DT:  { color: '#fca5a5', stroke: '#ef4444', label: 'DT',  shape: 'square' },
  NT:  { color: '#fca5a5', stroke: '#ef4444', label: 'NT',  shape: 'square' },
  MLB: { color: '#fb923c', stroke: '#ea580c', label: 'MLB' },
  OLB: { color: '#fdba74', stroke: '#f97316', label: 'OLB' },
  CB:  { color: '#4ade80', stroke: '#16a34a', label: 'CB' },
  SS:  { color: '#86efac', stroke: '#22c55e', label: 'SS' },
  FS:  { color: '#bbf7d0', stroke: '#4ade80', label: 'FS' },
};

export const OL_TYPES = ['LT', 'LG', 'C', 'RG', 'RT'];
export const DL_TYPES = ['DE', 'DT', 'NT'];

export const OFF_SKILL_TYPES: PlayerType[] = ['WR', 'RB', 'TE', 'FB'];
export const DEF_ADD_TYPES: PlayerType[]   = ['DE', 'DT', 'MLB', 'OLB', 'CB', 'SS', 'FS'];

export const ROUTE_TREE: { num: number; name: string; offsets: [number, number][] }[] = [
  { num: 1, name: 'Flat',        offsets: [[0, -3 * YARD], [6 * YARD, 0]] },
  { num: 2, name: 'Slant',       offsets: [[0, -5 * YARD], [-7 * YARD, -7 * YARD]] },
  { num: 3, name: 'Comeback',    offsets: [[0, -12 * YARD], [4 * YARD, 4 * YARD]] },
  { num: 4, name: 'Curl/Hook',   offsets: [[0, -10 * YARD], [0, 3 * YARD]] },
  { num: 5, name: 'Out',         offsets: [[0, -5 * YARD], [8 * YARD, 0]] },
  { num: 6, name: 'Dig/In',      offsets: [[0, -10 * YARD], [-8 * YARD, 0]] },
  { num: 7, name: 'Corner',      offsets: [[0, -12 * YARD], [8 * YARD, -8 * YARD]] },
  { num: 8, name: 'Post',        offsets: [[0, -12 * YARD], [-8 * YARD, -8 * YARD]] },
  { num: 9, name: 'Go/Fade',     offsets: [[1 * YARD, -30 * YARD]] },
];

export type OffensePlayerType = 'LT' | 'LG' | 'C' | 'RG' | 'RT' | 'QB' | 'WR' | 'RB' | 'TE' | 'FB';
export type DefensePlayerType = 'DE' | 'DT' | 'NT' | 'MLB' | 'OLB' | 'CB' | 'SS' | 'FS';
export type PlayerType = OffensePlayerType | DefensePlayerType;

export interface PlayPlayer {
  id: string;
  type: PlayerType;
  x: number;
  y: number;
}

export type RouteLineStyle = 'solid' | 'dashed' | 'dotted';

export type RouteEndStyle = 'arrow' | 'tee' | 'none';

export interface PlayRoute {
  playerId: string;
  points: [number, number][];
  lineStyle?: RouteLineStyle;
  endStyle?: RouteEndStyle;
  speed?: number;
}

export type PlayMode = 'offense' | 'defense';

export interface PlayData {
  losY: number;
  players: PlayPlayer[];
  routes: PlayRoute[];
  note?: string;
  playerNotes?: Record<string, string>;
  mode?: PlayMode;
}

export interface SavedPlay {
  id: number;
  name: string;
  folder: string;
  data: PlayData;
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

let _nid = 1;
export const genId = () => `p${Date.now()}_${_nid++}`;

export function yardFromY(y: number): number {
  return (H - y) / YARD;
}

export function yToYard(yd: number): number {
  return H - yd * YARD;
}

export const LOS_OPTIONS: { label: string; value: number }[] = [];
for (let yd = 5; yd <= 95; yd += 5) {
  LOS_OPTIONS.push({ label: `${yd} yd`, value: yToYard(yd) });
}

export function snapLosToOption(losY: number): number {
  let best = LOS_OPTIONS[0].value;
  let bestDist = Math.abs(losY - best);
  for (const opt of LOS_OPTIONS) {
    const d = Math.abs(losY - opt.value);
    if (d < bestDist) { best = opt.value; bestDist = d; }
  }
  return best;
}

export function makeDefaultPlay(): PlayData {
  const losY = yToYard(25);
  return {
    losY,
    mode: 'offense',
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

export function makeDefaultDefensePlay(): PlayData {
  const losY = yToYard(25);
  return {
    losY,
    mode: 'defense',
    players: [
      { id: 'de1',  type: 'DE',  x: 200, y: losY - YARD },
      { id: 'dt1',  type: 'DT',  x: 330, y: losY - YARD },
      { id: 'dt2',  type: 'DT',  x: 470, y: losY - YARD },
      { id: 'de2',  type: 'DE',  x: 600, y: losY - YARD },
      { id: 'olb1', type: 'OLB', x: 150, y: losY - 3 * YARD },
      { id: 'mlb',  type: 'MLB', x: 400, y: losY - 3 * YARD },
      { id: 'olb2', type: 'OLB', x: 650, y: losY - 3 * YARD },
      { id: 'cb1',  type: 'CB',  x: 60,  y: losY - 5 * YARD },
      { id: 'ss',   type: 'SS',  x: 560, y: losY - 6 * YARD },
      { id: 'fs',   type: 'FS',  x: 400, y: losY - 10 * YARD },
      { id: 'cb2',  type: 'CB',  x: 740, y: losY - 5 * YARD },
    ],
    routes: [],
  };
}

export function applyRouteTree(player: PlayPlayer, routeNum: number): [number, number][] {
  const route = ROUTE_TREE.find(r => r.num === routeNum);
  if (!route) return [];
  const sideSign = player.x >= W / 2 ? 1 : -1;
  const pts: [number, number][] = [];
  let cx = player.x, cy = player.y;
  for (const [dx, dy] of route.offsets) {
    cx = clamp(cx + dx * sideSign, 5, W - 5);
    cy = clamp(cy + dy, 5, H - 5);
    pts.push([cx, cy]);
  }
  return pts;
}

export function interpolatePolyline(pts: [number, number][], t: number): [number, number] {
  if (pts.length === 0) return [0, 0];
  if (pts.length === 1 || t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    totalLen += len;
  }
  if (totalLen === 0) return pts[pts.length - 1];
  const target = t * totalLen;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target) {
      const segT = segLens[i] > 0 ? (target - acc) / segLens[i] : 0;
      return [
        pts[i][0] + segT * (pts[i + 1][0] - pts[i][0]),
        pts[i][1] + segT * (pts[i + 1][1] - pts[i][1]),
      ];
    }
    acc += segLens[i];
  }
  return pts[pts.length - 1];
}

export function getEndSegment(pts: [number, number][], minDist = 10): [[number, number], [number, number]] {
  const to = pts[pts.length - 1];
  for (let i = pts.length - 2; i >= 0; i--) {
    const from = pts[i];
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    if (Math.sqrt(dx * dx + dy * dy) >= minDist) {
      return [from, to];
    }
  }
  return [pts[Math.max(0, pts.length - 2)], to];
}

export function makeTeePoints(from: [number, number], to: [number, number]): { x1: number; y1: number; x2: number; y2: number } | null {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return null;
  const perpX = -dy / len;
  const perpY = dx / len;
  const sz = 9;
  return {
    x1: to[0] + perpX * sz,
    y1: to[1] + perpY * sz,
    x2: to[0] - perpX * sz,
    y2: to[1] - perpY * sz,
  };
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

export function makeArrowPath(from: [number, number], to: [number, number]): string {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return '';
  const angle = Math.atan2(dy, dx);
  const sz = 12;
  const sp = 0.5;
  const p1x = to[0] - sz * Math.cos(angle - sp);
  const p1y = to[1] - sz * Math.sin(angle - sp);
  const p2x = to[0] - sz * Math.cos(angle + sp);
  const p2y = to[1] - sz * Math.sin(angle + sp);
  return `M ${p1x.toFixed(1)} ${p1y.toFixed(1)} L ${to[0].toFixed(1)} ${to[1].toFixed(1)} L ${p2x.toFixed(1)} ${p2y.toFixed(1)}`;
}
