import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  W, H, YARD, PLAYER_CFG, OL_TYPES,
  PlayPlayer, PlayRoute, PlayData, SavedPlay, RouteLineStyle, makeArrowPolygon, yardFromY, yToYard
} from "@/lib/playbook-types";

function FieldSVG({ play }: { play: PlayData }) {
  const losY = play.losY;

  const getStrokeDash = (style?: RouteLineStyle): string | undefined => {
    if (style === 'dashed') return '10 5';
    if (style === 'dotted') return '3 4';
    return undefined;
  };

  const renderRoute = (route: PlayRoute, player: PlayPlayer) => {
    const cfg = PLAYER_CFG[player.type];
    const pts: [number, number][] = [[player.x, player.y], ...route.points];
    if (pts.length < 2) return null;
    const d = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ');
    const from = pts[pts.length - 2];
    const to = pts[pts.length - 1];
    const arrow = makeArrowPolygon(from, to);
    const dash = getStrokeDash(route.lineStyle);
    return (
      <g key={route.playerId}>
        <path d={d} fill="none" stroke={cfg.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={dash} />
        {arrow && <polygon points={arrow} fill={cfg.color} />}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-cyan-500/20" style={{ background: '#0a0a0f' }}>
      {yToYard(0) >= 0 && yToYard(0) <= H && (
        <g>
          <rect x={0} y={yToYard(0) - 2} width={W} height={20} fill="#22d3ee08" />
          <text x={W / 2} y={yToYard(0) + 10} fill="#22d3ee" fontSize={10} fontFamily="monospace" textAnchor="middle" opacity={0.3} fontWeight="bold">
            SAJÁT ENDZONE
          </text>
        </g>
      )}

      {Array.from({ length: 51 }, (_, i) => {
        const yd = i;
        const lineY = yToYard(yd);
        if (lineY < 0 || lineY > H) return null;
        const isLos = Math.abs(lineY - losY) < 1;
        const is5 = yd % 5 === 0;
        const is10 = yd % 10 === 0;
        if (isLos) return null;
        if (!is5) {
          return (
            <g key={`h${yd}`}>
              <line x1={W / 2 - 50} y1={lineY} x2={W / 2 - 30} y2={lineY} stroke="#164e63" strokeWidth={0.5} />
              <line x1={W / 2 + 30} y1={lineY} x2={W / 2 + 50} y2={lineY} stroke="#164e63" strokeWidth={0.5} />
            </g>
          );
        }
        return (
          <g key={`yd${yd}`}>
            <line x1={0} y1={lineY} x2={W} y2={lineY}
              stroke={is10 ? '#0e7490' : '#164e63'}
              strokeWidth={is10 ? 1 : 0.5}
              strokeDasharray={is10 ? '6 4' : '3 5'}
              opacity={0.5} />
            {is10 && (
              <text x={14} y={lineY - 3} fill="#22d3ee" fontSize={9} fontFamily="monospace" opacity={0.35}>
                {yd}
              </text>
            )}
            {is10 && (
              <text x={W - 14} y={lineY - 3} fill="#22d3ee" fontSize={9} fontFamily="monospace" textAnchor="end" opacity={0.35}>
                {yd}
              </text>
            )}
          </g>
        );
      })}

      <line x1={0} y1={losY} x2={W} y2={losY} stroke="#22d3ee" strokeWidth={2.5} />
      <rect x={W - 60} y={losY - 14} width={56} height={14} fill="#22d3ee15" rx={2} />
      <text x={W - 6} y={losY - 3} fill="#22d3ee" fontSize={9} fontFamily="monospace" textAnchor="end" fontWeight="bold" opacity={0.9}>
        LOS {Math.round(yardFromY(losY))}
      </text>

      <line x1={5} y1={0} x2={5} y2={H} stroke="#22d3ee" strokeWidth={2} opacity={0.15} />
      <line x1={W - 5} y1={0} x2={W - 5} y2={H} stroke="#22d3ee" strokeWidth={2} opacity={0.15} />

      {play.routes.map(route => {
        const player = play.players.find(p => p.id === route.playerId);
        if (!player) return null;
        return renderRoute(route, player);
      })}

      {play.players.map(player => {
        const cfg = PLAYER_CFG[player.type];
        const isOL = OL_TYPES.includes(player.type);
        const hasNote = !!(play.playerNotes?.[player.id]);
        return (
          <g key={player.id} transform={`translate(${player.x},${player.y})`}>
            {isOL ? (
              <rect x={-11} y={-11} width={22} height={22} fill={cfg.color} rx={3} stroke={cfg.stroke} strokeWidth={1.5} />
            ) : (
              <circle r={12} fill={cfg.color} stroke={cfg.stroke} strokeWidth={1.5} />
            )}
            <text textAnchor="middle" dominantBaseline="middle" fill="white"
              fontSize={isOL ? 7 : 9} fontWeight="bold" fontFamily="monospace"
              style={{ pointerEvents: 'none' }}>
              {cfg.label}
            </text>
            {hasNote && (
              <g transform={`translate(${isOL ? 11 : 10}, ${isOL ? -11 : -10})`}>
                <circle r={5} fill={cfg.color} stroke="#000" strokeWidth={0.5} />
                <text textAnchor="middle" dominantBaseline="middle" fill="white"
                  fontSize={8} fontWeight="bold" fontFamily="sans-serif"
                  style={{ pointerEvents: 'none' }}>!</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function PlaybookViewer() {
  const { data: plays = [], isLoading } = useQuery<SavedPlay[]>({ queryKey: ['/api/my-playbook'] });
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, Math.max(0, plays.length - 1));

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (plays.length === 0) {
    return (
      <div className="text-center py-20" data-testid="playbook-empty">
        <BookOpen className="w-12 h-12 text-cyan-500/20 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Az edződ még nem mentett playt a playbookba.</p>
      </div>
    );
  }

  const current = plays[safeIdx];
  if (!current) return null;

  return (
    <div className="space-y-4 max-w-3xl mx-auto" data-testid="playbook-viewer">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={safeIdx === 0}
          className="p-1.5 text-cyan-400/60 hover:text-cyan-400 disabled:opacity-30 transition-colors"
          data-testid="button-prev-play"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-bold text-foreground text-lg" data-testid="text-play-name">{current.name}</p>
          <p className="text-xs text-cyan-400/40">{safeIdx + 1} / {plays.length}</p>
        </div>
        <button
          onClick={() => setIdx(i => Math.min(plays.length - 1, i + 1))}
          disabled={safeIdx === plays.length - 1}
          className="p-1.5 text-cyan-400/60 hover:text-cyan-400 disabled:opacity-30 transition-colors"
          data-testid="button-next-play"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {plays.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {plays.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn("w-2 h-2 rounded-full transition-all", i === safeIdx ? "bg-cyan-400 scale-125" : "bg-cyan-500/20 hover:bg-cyan-500/40")}
            />
          ))}
        </div>
      )}

      <FieldSVG play={current.data} />

      {current.data.note && (
        <div className="bg-black/30 border border-cyan-500/15 rounded-lg px-3 py-2" data-testid="text-play-note">
          <p className="text-[10px] text-cyan-400/40 font-mono uppercase tracking-wider mb-0.5">Jegyzet</p>
          <p className="text-xs text-white/70 whitespace-pre-wrap">{current.data.note}</p>
        </div>
      )}

      {current.data.playerNotes && Object.keys(current.data.playerNotes).length > 0 && (
        <div className="bg-black/30 border border-cyan-500/15 rounded-lg px-3 py-2 space-y-1.5" data-testid="player-notes-section">
          <p className="text-[10px] text-cyan-400/40 font-mono uppercase tracking-wider">Játékos jegyzetek</p>
          {Object.entries(current.data.playerNotes).map(([pid, note]) => {
            const player = current.data.players.find(p => p.id === pid);
            if (!player) return null;
            const cfg = PLAYER_CFG[player.type];
            return (
              <div key={pid} className="flex items-start gap-2">
                <span className="text-[10px] font-bold font-mono shrink-0 mt-0.5" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="text-[10px] text-white/60">{note}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center pt-1">
        {[
          { label: 'OL', color: '#0ea5e9' },
          { label: 'QB', color: '#22d3ee' },
          { label: 'WR', color: '#f59e0b' },
          { label: 'RB', color: '#ef4444' },
          { label: 'TE', color: '#a855f7' },
          { label: 'FB', color: '#ec4899' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 flex items-center justify-center", label === 'OL' ? 'rounded-sm' : 'rounded-full')}
              style={{ background: color }} />
            <span className="text-xs text-cyan-400/50 font-mono">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
