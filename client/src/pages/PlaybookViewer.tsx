import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, BookOpen, FolderOpen, ArrowLeft, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  W, H, YARD, PLAYER_CFG, OL_TYPES,
  PlayPlayer, PlayRoute, PlayData, SavedPlay, RouteLineStyle, makeArrowPath, makeTeePoints, getEndSegment, interpolatePolyline, yardFromY, yToYard
} from "@/lib/playbook-types";

function MiniFieldSVG({ play }: { play: PlayData }) {
  const losY = play.losY;
  const getStrokeDash = (style?: RouteLineStyle): string | undefined => {
    if (style === 'dashed') return '10 5';
    if (style === 'dotted') return '3 4';
    return undefined;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full rounded border border-cyan-500/15 block" style={{ background: '#0a0a0f' }}>
      {Array.from({ length: 51 }, (_, i) => {
        const yd = i;
        const lineY = yToYard(yd);
        if (lineY < 0 || lineY > H) return null;
        const is10 = yd % 10 === 0;
        if (!is10) return null;
        return (
          <line key={`yd${yd}`} x1={0} y1={lineY} x2={W} y2={lineY}
            stroke="#0e7490" strokeWidth={1} strokeDasharray="6 4" opacity={0.3} />
        );
      })}
      <line x1={0} y1={losY} x2={W} y2={losY} stroke="#22d3ee" strokeWidth={2.5} />
      {play.routes.map(route => {
        const player = play.players.find(p => p.id === route.playerId);
        if (!player) return null;
        const cfg = PLAYER_CFG[player.type];
        const pts: [number, number][] = [[player.x, player.y], ...route.points];
        if (pts.length < 2) return null;
        const d = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ');
        const [from, to] = getEndSegment(pts);
        const endStyle = route.endStyle ?? 'arrow';
        const arrowPath = endStyle === 'arrow' ? makeArrowPath(from, to) : '';
        const tee = endStyle === 'tee' ? makeTeePoints(from, to) : null;
        const dash = getStrokeDash(route.lineStyle);
        return (
          <g key={route.playerId}>
            <path d={d} fill="none" stroke={cfg.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} />
            {arrowPath && <path d={arrowPath} fill="none" stroke={cfg.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
            {tee && <line x1={tee.x1} y1={tee.y1} x2={tee.x2} y2={tee.y2} stroke={cfg.color} strokeWidth={3} strokeLinecap="round" />}
          </g>
        );
      })}
      {play.players.map(player => {
        const cfg = PLAYER_CFG[player.type];
        const isOL = OL_TYPES.includes(player.type);
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
          </g>
        );
      })}
    </svg>
  );
}

function FieldSVG({ play }: { play: PlayData }) {
  const losY = play.losY;
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const animStartRef = useRef<number | null>(null);
  const ANIM_DURATION = 2500;

  const playAnimation = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animStartRef.current = null;
    setIsAnimating(true);
    setAnimProgress(0);
    const step = (ts: number) => {
      if (!animStartRef.current) animStartRef.current = ts;
      const raw = Math.min((ts - animStartRef.current) / ANIM_DURATION, 1);
      const t = raw * raw * (3 - 2 * raw);
      setAnimProgress(t);
      if (raw < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
        setAnimProgress(0);
        animStartRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

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
    const [from, to] = getEndSegment(pts);
    const endStyle = route.endStyle ?? 'arrow';
    const arrowPath = endStyle === 'arrow' ? makeArrowPath(from, to) : '';
    const tee = endStyle === 'tee' ? makeTeePoints(from, to) : null;
    const dash = getStrokeDash(route.lineStyle);
    return (
      <g key={route.playerId}>
        <path d={d} fill="none" stroke={cfg.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={dash} />
        {arrowPath && <path d={arrowPath} fill="none" stroke={cfg.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {tee && <line x1={tee.x1} y1={tee.y1} x2={tee.x2} y2={tee.y2} stroke={cfg.color} strokeWidth={3} strokeLinecap="round" />}
      </g>
    );
  };

  const getScreenPos = useCallback((svgX: number, svgY: number) => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return { x: 0, y: 0 };
    const svgRect = svg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
      x: svgRect.left - containerRect.left + (svgX / W) * svgRect.width,
      y: svgRect.top - containerRect.top + (svgY / H) * svgRect.height,
    };
  }, []);

  const onPlayerClick = (playerId: string) => {
    if (play.playerNotes?.[playerId]) {
      setActiveNote(prev => prev === playerId ? null : playerId);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-cyan-500/20 block" style={{ background: '#0a0a0f' }}
      onClick={(e) => { if ((e.target as Element).tagName === 'svg') setActiveNote(null); }}>
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
        let px = player.x, py = player.y;
        if (animProgress > 0) {
          const route = play.routes.find(r => r.playerId === player.id);
          if (route && route.points.length > 0) {
            const pts: [number, number][] = [[player.x, player.y], ...route.points];
            const t = Math.min(animProgress * (route.speed ?? 1), 1);
            [px, py] = interpolatePolyline(pts, t);
          }
        }
        return (
          <g key={player.id} transform={`translate(${px},${py})`}
            onClick={(e) => { e.stopPropagation(); if (animProgress === 0) onPlayerClick(player.id); }}
            style={{ cursor: hasNote && animProgress === 0 ? 'pointer' : 'default' }}>
            {activeNote === player.id && <circle r={17} fill="none" stroke={cfg.color} strokeWidth={2} opacity={0.7} />}
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

    {activeNote && play.playerNotes?.[activeNote] && (() => {
      const player = play.players.find(p => p.id === activeNote);
      if (!player) return null;
      const pos = getScreenPos(player.x, player.y);
      const cfg = PLAYER_CFG[player.type];
      return (
        <div
          className="absolute z-50"
          style={{ left: pos.x, top: pos.y - 20, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-black/95 border rounded-lg px-3 py-2 shadow-xl max-w-[200px] text-center"
            style={{ borderColor: cfg.color + '60' }}>
            <p className="text-[10px] text-white/80 whitespace-pre-wrap leading-tight">
              {play.playerNotes![activeNote]}
            </p>
          </div>
          <div className="w-0 h-0 mx-auto" style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${cfg.color}60`,
          }} />
        </div>
      );
    })()}

    <button
      onClick={playAnimation}
      disabled={isAnimating || play.routes.length === 0}
      data-testid="button-play-animation"
      className={cn(
        "absolute bottom-3 right-3 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all",
        isAnimating
          ? "bg-cyan-500/20 border border-cyan-500/30 cursor-not-allowed"
          : play.routes.length === 0
            ? "bg-black/40 border border-cyan-500/10 cursor-not-allowed opacity-30"
            : "bg-cyan-500/90 border border-cyan-400 hover:bg-cyan-400 hover:scale-105 cursor-pointer"
      )}
      title="Play animáció indítása"
    >
      {isAnimating ? (
        <div className="w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
      ) : (
        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
      )}
    </button>
    </div>
  );
}

type ViewState = { mode: 'folders' } | { mode: 'plays'; folder: string } | { mode: 'detail'; play: SavedPlay };

export default function PlaybookViewer() {
  const { data: plays = [], isLoading } = useQuery<SavedPlay[]>({ queryKey: ['/api/my-playbook'] });
  const [view, setView] = useState<ViewState>({ mode: 'folders' });

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

  const folders: Record<string, SavedPlay[]> = {};
  plays.forEach(p => {
    const f = p.folder || 'Általános';
    if (!folders[f]) folders[f] = [];
    folders[f].push(p);
  });
  const sortedFolders = Object.entries(folders).sort(([a], [b]) => a.localeCompare(b));

  if (view.mode === 'detail') {
    const current = view.play;
    return (
      <div className="space-y-4 max-w-3xl mx-auto" data-testid="playbook-viewer-detail">
        <button
          onClick={() => setView({ mode: 'plays', folder: current.folder || 'Általános' })}
          className="flex items-center gap-1.5 text-cyan-400/70 hover:text-cyan-400 text-xs transition-colors"
          data-testid="button-back-to-plays"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vissza: {current.folder || 'Általános'}</span>
        </button>

        <div className="text-center">
          <p className="font-bold text-foreground text-lg" data-testid="text-play-name">{current.name}</p>
          <p className="text-xs text-cyan-400/40">{current.folder || 'Általános'}</p>
        </div>

        <FieldSVG play={current.data} />

        {current.data.note && (
          <div className="bg-black/30 border border-cyan-500/15 rounded-lg px-3 py-2" data-testid="text-play-note">
            <p className="text-[10px] text-cyan-400/40 font-mono uppercase tracking-wider mb-0.5">Jegyzet</p>
            <p className="text-xs text-white/70 whitespace-pre-wrap">{current.data.note}</p>
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

  if (view.mode === 'plays') {
    const folderPlays = folders[view.folder] || [];
    return (
      <div className="space-y-4 max-w-4xl mx-auto" data-testid="playbook-viewer-plays">
        <button
          onClick={() => setView({ mode: 'folders' })}
          className="flex items-center gap-1.5 text-cyan-400/70 hover:text-cyan-400 text-xs transition-colors"
          data-testid="button-back-to-folders"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Mappák</span>
        </button>

        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-foreground">{view.folder}</h2>
          <span className="text-xs text-cyan-400/40">{folderPlays.length} play</span>
        </div>

        {folderPlays.length === 0 ? (
          <p className="text-center text-muted-foreground/50 text-sm py-10">Nincs play ebben a mappában.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {folderPlays.map(p => (
              <button
                key={p.id}
                onClick={() => setView({ mode: 'detail', play: p })}
                data-testid={`play-thumb-${p.id}`}
                className="group bg-black/40 border border-cyan-500/15 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="aspect-[4/3] p-1.5">
                  <MiniFieldSVG play={p.data} />
                </div>
                <div className="px-2 py-1.5 border-t border-cyan-500/10">
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-cyan-400 transition-colors">{p.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto" data-testid="playbook-viewer">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Playbook</h2>
        <p className="text-xs text-cyan-400/40">{plays.length} play, {sortedFolders.length} mappa</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sortedFolders.map(([folder, folderPlays]) => (
          <button
            key={folder}
            onClick={() => setView({ mode: 'plays', folder })}
            data-testid={`folder-card-${folder}`}
            className="group bg-black/40 border border-cyan-500/15 rounded-lg p-4 text-left hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
          >
            <FolderOpen className="w-8 h-8 text-cyan-400/40 group-hover:text-cyan-400 transition-colors mb-2" />
            <p className="font-bold text-sm text-foreground group-hover:text-cyan-400 transition-colors truncate">{folder}</p>
            <p className="text-[11px] text-cyan-400/30 mt-0.5">{folderPlays.length} play</p>
          </button>
        ))}
      </div>
    </div>
  );
}
