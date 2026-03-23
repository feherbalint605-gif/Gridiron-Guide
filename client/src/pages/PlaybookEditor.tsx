import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MousePointer, Pen, Plus, Trash2, Save, Check, X, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  W, H, YARD, PLAYER_CFG, OL_TYPES, ROUTE_TREE,
  PlayerType, PlayPlayer, PlayRoute, PlayData, SavedPlay,
  clamp, makeDefaultPlay, applyRouteTree, makeArrowPolygon, genId
} from "@/lib/playbook-types";

export default function PlaybookEditor() {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);

  const [play, setPlay] = useState<PlayData>(makeDefaultPlay);
  const [playName, setPlayName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tool, setTool] = useState<'select' | 'route'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [routePts, setRoutePts] = useState<[number, number][] | null>(null);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  const { data: plays = [] } = useQuery<SavedPlay[]>({ queryKey: ['/api/playbook'] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!playName.trim()) throw new Error('Add nevet a play-nek!');
      const body = { name: playName.trim(), data: play };
      const res = editingId
        ? await apiRequest('PUT', `/api/playbook/${editingId}`, body)
        : await apiRequest('POST', '/api/playbook', body);
      if (!res.ok) throw new Error('Mentési hiba');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook'] });
      if (!editingId && data?.id) setEditingId(data.id);
      toast({ title: editingId ? 'Play frissítve!' : 'Play mentve!' });
    },
    onError: (e: any) => toast({ title: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/playbook/${id}`); },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook'] });
      if (editingId === deletedId) newPlay();
      toast({ title: 'Play törölve' });
    },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setRoutePts(null); setTool('select'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const getSvgXY = useCallback((e: React.MouseEvent | React.PointerEvent): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    return [
      clamp(((e.clientX - r.left) / r.width) * W, 0, W),
      clamp(((e.clientY - r.top) / r.height) * H, 0, H),
    ];
  }, []);

  const loadPlay = (p: SavedPlay) => {
    setPlay(JSON.parse(JSON.stringify(p.data)));
    setPlayName(p.name);
    setEditingId(p.id);
    setSelectedId(null);
    setRoutePts(null);
    setTool('select');
  };

  const newPlay = () => {
    setPlay(makeDefaultPlay());
    setPlayName('');
    setEditingId(null);
    setSelectedId(null);
    setRoutePts(null);
  };

  const addPlayer = (type: PlayerType) => {
    const id = genId();
    setPlay(p => ({
      ...p,
      players: [...p.players, { id, type, x: W / 2, y: p.losY + 5 * YARD }],
    }));
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setPlay(p => ({
      ...p,
      players: p.players.filter(pl => pl.id !== selectedId),
      routes: p.routes.filter(r => r.playerId !== selectedId),
    }));
    setSelectedId(null);
  };

  const clearRouteForSelected = () => {
    if (!selectedId) return;
    setPlay(p => ({ ...p, routes: p.routes.filter(r => r.playerId !== selectedId) }));
  };

  const applyRoute = (name: string) => {
    if (!selectedId) return;
    const player = play.players.find(p => p.id === selectedId);
    if (!player) return;
    const pts = applyRouteTree(player, name);
    setPlay(p => ({
      ...p,
      routes: [...p.routes.filter(r => r.playerId !== selectedId), { playerId: selectedId, points: pts }],
    }));
  };

  const finishRoute = () => {
    if (!selectedId || !routePts || routePts.length === 0) return;
    setPlay(p => ({
      ...p,
      routes: [...p.routes.filter(r => r.playerId !== selectedId), { playerId: selectedId, points: routePts }],
    }));
    setRoutePts(null);
  };

  const onSvgPointerDown = (e: React.PointerEvent) => {
    const [x, y] = getSvgXY(e);
    if (tool === 'select') {
      setSelectedId(null);
    } else if (tool === 'route' && selectedId) {
      setRoutePts(prev => prev ? [...prev, [x, y]] : [[x, y]]);
    }
  };

  const onSvgPointerMove = (e: React.PointerEvent) => {
    const [x, y] = getSvgXY(e);
    setMousePos([x, y]);
    if (dragging) {
      setPlay(p => ({
        ...p,
        players: p.players.map(pl =>
          pl.id === dragging ? { ...pl, x: clamp(x, 12, W - 12), y: clamp(y, 12, H - 12) } : pl
        ),
      }));
    }
  };

  const onPlayerPointerDown = (playerId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedId(playerId);
    if (tool === 'select') {
      setDragging(playerId);
      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    }
  };

  const losY = play.losY;

  const renderRoute = (route: PlayRoute, player: PlayPlayer, isDashed = false) => {
    const cfg = PLAYER_CFG[player.type];
    const pts: [number, number][] = [[player.x, player.y], ...route.points];
    if (pts.length < 2) return null;
    const d = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ');
    const from = pts[pts.length - 2];
    const to = pts[pts.length - 1];
    const arrow = makeArrowPolygon(from, to);
    return (
      <g key={route.playerId + (isDashed ? '_d' : '')}>
        <path d={d} fill="none" stroke={cfg.color} strokeWidth={isDashed ? 2 : 2.5}
          strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={isDashed ? '6 4' : undefined}
          opacity={isDashed ? 0.6 : 1} />
        {!isDashed && arrow && <polygon points={arrow} fill={cfg.color} />}
      </g>
    );
  };

  return (
    <div className="flex gap-4 h-full" data-testid="playbook-editor">
      {/* Left: Play list */}
      <div className="w-44 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Playbook</span>
          <button onClick={newPlay} className="text-primary hover:text-primary/80" title="Új play" data-testid="button-new-play">
            <FilePlus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {plays.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-6">Nincs mentett play</p>
          )}
          {plays.map(p => (
            <div
              key={p.id}
              onClick={() => loadPlay(p)}
              data-testid={`play-item-${p.id}`}
              className={cn(
                "group flex items-center gap-1 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors",
                editingId === p.id ? "bg-primary text-black font-bold" : "hover:bg-white/5 text-foreground"
              )}
            >
              <span className="flex-1 truncate text-xs">{p.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p.id); }}
                data-testid={`button-delete-play-${p.id}`}
                className={cn("opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                  editingId === p.id ? "text-black/50 hover:text-black" : "text-muted-foreground hover:text-red-400")}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-card/30 border border-border rounded-lg px-3 py-2">
          <div className="flex gap-1">
            <button
              onClick={() => { setTool('select'); setRoutePts(null); }}
              data-testid="button-tool-select"
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all",
                tool === 'select' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/10")}
            >
              <MousePointer className="w-3 h-3" /> Mozgatás
            </button>
            <button
              onClick={() => { setTool('route'); setRoutePts(null); }}
              data-testid="button-tool-route"
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all",
                tool === 'route' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/10")}
            >
              <Pen className="w-3 h-3" /> Route rajz
            </button>
          </div>

          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">+Játékos:</span>
            {(['WR', 'RB', 'TE', 'FB'] as PlayerType[]).map(t => (
              <button
                key={t}
                onClick={() => addPlayer(t)}
                data-testid={`button-add-${t.toLowerCase()}`}
                className="px-2 py-0.5 rounded text-[11px] font-bold border transition-colors hover:bg-white/10"
                style={{ color: PLAYER_CFG[t].color, borderColor: PLAYER_CFG[t].color + '50' }}
              >
                +{t}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase">LOS:</span>
            <input
              type="range" min={60} max={420} value={losY}
              onChange={e => setPlay(p => ({ ...p, losY: Number(e.target.value) }))}
              className="w-24 accent-primary h-1"
              data-testid="input-los-slider"
            />
          </div>

          {selectedId && (
            <button
              onClick={removeSelected}
              data-testid="button-remove-player"
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-red-400 hover:bg-red-400/10 border border-red-400/20"
            >
              <Trash2 className="w-3 h-3" /> Törlés
            </button>
          )}
        </div>

        {/* SVG Field */}
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className={cn("w-full rounded-xl border border-border block select-none",
              tool === 'route' ? 'cursor-crosshair' : 'cursor-default')}
            style={{ background: '#1a4d1a', touchAction: 'none' }}
            onPointerDown={onSvgPointerDown}
            onPointerMove={onSvgPointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setMousePos(null)}
          >
            {/* Yard lines */}
            {Array.from({ length: 13 }, (_, i) => i - 6).map(offset => {
              const lineY = losY + offset * 5 * YARD;
              if (lineY < 0 || lineY > H) return null;
              const isLos = offset === 0;
              const isMajor = offset % 2 === 0;
              return (
                <g key={offset}>
                  <line x1={0} y1={lineY} x2={W} y2={lineY}
                    stroke={isLos ? '#ffd700' : isMajor ? '#3a7a3a' : '#2a5a2a'}
                    strokeWidth={isLos ? 2.5 : isMajor ? 1 : 0.5}
                    strokeDasharray={isLos ? undefined : isMajor ? '6 4' : '3 5'} />
                  {isMajor && !isLos && (
                    <text x={14} y={lineY - 3} fill="#4ade80" fontSize={9} fontFamily="monospace" opacity={0.5}>
                      {Math.abs(offset) * 5}yd
                    </text>
                  )}
                </g>
              );
            })}

            {/* LOS label */}
            <rect x={W - 48} y={losY - 13} width={44} height={13} fill="#ffd70015" rx={2} />
            <text x={W - 6} y={losY - 3} fill="#ffd700" fontSize={9} fontFamily="monospace" textAnchor="end" fontWeight="bold" opacity={0.9}>
              LOS
            </text>

            {/* Hash marks */}
            {Array.from({ length: 51 }, (_, i) => {
              const ly = losY - 25 * YARD + i * YARD;
              if (ly < 0 || ly > H) return null;
              return (
                <g key={`h${i}`}>
                  <line x1={W / 2 - 50} y1={ly} x2={W / 2 - 30} y2={ly} stroke="#2a5a2a" strokeWidth={0.5} />
                  <line x1={W / 2 + 30} y1={ly} x2={W / 2 + 50} y2={ly} stroke="#2a5a2a" strokeWidth={0.5} />
                </g>
              );
            })}

            {/* Sidelines */}
            <line x1={5} y1={0} x2={5} y2={H} stroke="#4ade80" strokeWidth={2} opacity={0.25} />
            <line x1={W - 5} y1={0} x2={W - 5} y2={H} stroke="#4ade80" strokeWidth={2} opacity={0.25} />

            {/* Saved routes */}
            {play.routes.map(route => {
              const player = play.players.find(p => p.id === route.playerId);
              if (!player) return null;
              return renderRoute(route, player);
            })}

            {/* Route being drawn */}
            {tool === 'route' && selectedId && mousePos && (() => {
              const player = play.players.find(p => p.id === selectedId);
              if (!player) return null;
              const pts: [number, number][] = routePts
                ? [[player.x, player.y], ...routePts, mousePos]
                : [[player.x, player.y], mousePos];
              if (pts.length < 2) return null;
              const d = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ');
              return (
                <path d={d} fill="none" stroke={PLAYER_CFG[player.type].color}
                  strokeWidth={2} strokeDasharray="6 3" strokeLinejoin="round"
                  strokeLinecap="round" opacity={0.55} />
              );
            })()}

            {/* Players */}
            {play.players.map(player => {
              const cfg = PLAYER_CFG[player.type];
              const sel = selectedId === player.id;
              const isOL = OL_TYPES.includes(player.type);
              return (
                <g
                  key={player.id}
                  transform={`translate(${player.x},${player.y})`}
                  onPointerDown={(e) => onPlayerPointerDown(player.id, e)}
                  style={{ cursor: tool === 'select' ? 'grab' : 'pointer', touchAction: 'none' }}
                  data-testid={`player-${player.id}`}
                >
                  {sel && <circle r={17} fill="none" stroke="white" strokeWidth={2} opacity={0.8} />}
                  {isOL ? (
                    <rect x={-11} y={-11} width={22} height={22} fill={cfg.color} rx={3}
                      stroke={sel ? 'white' : cfg.stroke} strokeWidth={1.5} />
                  ) : (
                    <circle r={12} fill={cfg.color} stroke={sel ? 'white' : cfg.stroke} strokeWidth={1.5} />
                  )}
                  <text textAnchor="middle" dominantBaseline="middle" fill="white"
                    fontSize={isOL ? 7 : 9} fontWeight="bold" fontFamily="monospace"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {cfg.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Route drawing overlay */}
          {tool === 'route' && selectedId && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {routePts && routePts.length > 0 ? (
                <>
                  <button onClick={finishRoute} data-testid="button-finish-route"
                    className="flex items-center gap-1 px-2 py-1 bg-primary text-black text-xs font-bold rounded shadow">
                    <Check className="w-3 h-3" /> Kész
                  </button>
                  <button onClick={() => setRoutePts(null)}
                    className="flex items-center gap-1 px-2 py-1 bg-black/60 text-red-400 text-xs font-bold rounded border border-red-400/30">
                    <X className="w-3 h-3" /> Mégse
                  </button>
                </>
              ) : (
                <div className="px-2 py-1 bg-black/70 text-muted-foreground text-[10px] rounded">
                  Kattints a mezőre a route rajzolásához
                </div>
              )}
            </div>
          )}
        </div>

        {/* Route Tree + Save */}
        <div className="flex flex-col gap-3">
          <div className="bg-card/20 border border-border/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-primary uppercase tracking-widest">Route Tree</span>
              {selectedId && (
                <button onClick={clearRouteForSelected} className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors" data-testid="button-clear-route">
                  Route törlése
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(ROUTE_TREE).map(name => (
                <button
                  key={name}
                  onClick={() => applyRoute(name)}
                  disabled={!selectedId}
                  data-testid={`button-route-${name.replace(/[^a-zA-Z]/g, '')}`}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-bold border transition-all",
                    selectedId
                      ? "border-primary/30 text-primary/80 hover:bg-primary/10 hover:border-primary/60 hover:text-primary"
                      : "border-border/20 text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-2">
              {selectedId
                ? "Válassz route-ot, vagy rajzolj kézzel a Route rajz eszközzel."
                : "Kattints egy játékosra a kiválasztáshoz."}
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={playName}
              onChange={e => setPlayName(e.target.value)}
              placeholder="Play neve (pl. Slant Right, HB Counter...)"
              className="flex-1 bg-black/20 border-border/30 focus:border-primary h-9 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && playName.trim()) saveMutation.mutate(); }}
              data-testid="input-play-name"
            />
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !playName.trim()}
              className="bg-primary text-black font-bold shrink-0"
              data-testid="button-save-play"
            >
              <Save className="w-4 h-4 mr-1" />
              {editingId ? 'Frissítés' : 'Mentés'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
