import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MousePointer, Pen, Plus, Trash2, Save, Check, X, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  W, H, YARD, PLAYER_CFG, OL_TYPES, ROUTE_TREE, LOS_OPTIONS,
  PlayerType, PlayPlayer, PlayRoute, PlayData, SavedPlay,
  clamp, makeDefaultPlay, applyRouteTree, makeArrowPolygon, genId, snapLosToOption, yardFromY, yToYard
} from "@/lib/playbook-types";

export default function PlaybookEditor() {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [play, setPlay] = useState<PlayData>(makeDefaultPlay);
  const [playName, setPlayName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tool, setTool] = useState<'select' | 'route'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [routePts, setRoutePts] = useState<[number, number][] | null>(null);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const [showRouteMenu, setShowRouteMenu] = useState<{ x: number; y: number } | null>(null);

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
      if (e.key === 'Escape') { setRoutePts(null); setTool('select'); setShowRouteMenu(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (!showRouteMenu) return;
    const h = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-route-menu]')) setShowRouteMenu(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showRouteMenu]);

  const viewMinY = play.losY - H / 2;

  const getSvgXY = useCallback((e: React.MouseEvent | React.PointerEvent): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    const vMinY = play.losY - H / 2;
    return [
      clamp(((e.clientX - r.left) / r.width) * W, 0, W),
      clamp(vMinY + ((e.clientY - r.top) / r.height) * H, vMinY, vMinY + H),
    ];
  }, [play.losY]);

  const getScreenXY = useCallback((svgX: number, svgY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return { x: 0, y: 0 };
    const svgRect = svg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const vMinY = play.losY - H / 2;
    return {
      x: svgRect.left - containerRect.left + (svgX / W) * svgRect.width,
      y: svgRect.top - containerRect.top + ((svgY - vMinY) / H) * svgRect.height,
    };
  }, [play.losY]);

  const loadPlay = (p: SavedPlay) => {
    const data = JSON.parse(JSON.stringify(p.data)) as PlayData;
    data.losY = snapLosToOption(data.losY);
    setPlay(data);
    setPlayName(p.name);
    setEditingId(p.id);
    setSelectedId(null);
    setRoutePts(null);
    setTool('select');
    setShowRouteMenu(null);
  };

  const newPlay = () => {
    setPlay(makeDefaultPlay());
    setPlayName('');
    setEditingId(null);
    setSelectedId(null);
    setRoutePts(null);
    setShowRouteMenu(null);
  };

  const addPlayer = (type: PlayerType) => {
    const id = genId();
    setPlay(p => ({
      ...p,
      players: [...p.players, { id, type, x: W / 2, y: p.losY + 5 * YARD }],
    }));
    setSelectedId(id);
    setShowRouteMenu(null);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setPlay(p => ({
      ...p,
      players: p.players.filter(pl => pl.id !== selectedId),
      routes: p.routes.filter(r => r.playerId !== selectedId),
    }));
    setSelectedId(null);
    setShowRouteMenu(null);
  };

  const applyRoute = (routeNum: number) => {
    if (!selectedId) return;
    const player = play.players.find(p => p.id === selectedId);
    if (!player) return;
    const pts = applyRouteTree(player, routeNum);
    setPlay(p => ({
      ...p,
      routes: [...p.routes.filter(r => r.playerId !== selectedId), { playerId: selectedId, points: pts }],
    }));
    setShowRouteMenu(null);
  };

  const startCustomRoute = () => {
    setTool('route');
    setRoutePts(null);
    setShowRouteMenu(null);
  };

  const clearRouteForSelected = () => {
    if (!selectedId) return;
    setPlay(p => ({ ...p, routes: p.routes.filter(r => r.playerId !== selectedId) }));
    setShowRouteMenu(null);
  };

  const finishRoute = () => {
    if (!selectedId || !routePts || routePts.length === 0) return;
    setPlay(p => ({
      ...p,
      routes: [...p.routes.filter(r => r.playerId !== selectedId), { playerId: selectedId, points: routePts }],
    }));
    setRoutePts(null);
    setTool('select');
  };

  const onSvgPointerDown = (e: React.PointerEvent) => {
    const [x, y] = getSvgXY(e);
    if (tool === 'select') {
      setSelectedId(null);
      setShowRouteMenu(null);
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

  const isReceiver = (type: PlayerType) => !OL_TYPES.includes(type);

  const dragStartRef = useRef<{ x: number; y: number; id: string; moved: boolean } | null>(null);

  const onPlayerPointerDown = (player: PlayPlayer, e: React.PointerEvent) => {
    e.stopPropagation();
    if (tool === 'route') {
      setSelectedId(player.id);
      return;
    }
    setSelectedId(player.id);
    setShowRouteMenu(null);
    dragStartRef.current = { x: e.clientX, y: e.clientY, id: player.id, moved: false };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };

  const onPlayerPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
      setDragging(dragStartRef.current.id);
    }
    onSvgPointerMove(e);
  };

  const onPlayerPointerUp = (player: PlayPlayer) => {
    const ref = dragStartRef.current;
    dragStartRef.current = null;
    setDragging(null);
    if (ref && !ref.moved && isReceiver(player.type) && tool === 'select') {
      const pos = getScreenXY(player.x, player.y);
      setShowRouteMenu({ x: pos.x, y: pos.y });
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

  const selectedPlayer = selectedId ? play.players.find(p => p.id === selectedId) : null;

  return (
    <div className="flex gap-4 h-full" data-testid="playbook-editor">
      <div className="w-44 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-cyan-400 tracking-widest">Playbook</span>
          <button onClick={newPlay} className="text-cyan-400 hover:text-cyan-300" title="Új play" data-testid="button-new-play">
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
                editingId === p.id ? "bg-cyan-500 text-black font-bold" : "hover:bg-white/5 text-foreground"
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

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 bg-black/40 border border-cyan-500/20 rounded-lg px-3 py-2">
          <div className="flex gap-1">
            <button
              onClick={() => { setTool('select'); setRoutePts(null); setShowRouteMenu(null); }}
              data-testid="button-tool-select"
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all",
                tool === 'select' ? "bg-cyan-500 text-black" : "text-cyan-400/60 hover:text-cyan-300 hover:bg-white/5")}
            >
              <MousePointer className="w-3 h-3" /> Mozgatás
            </button>
            <button
              onClick={() => { setTool('route'); setRoutePts(null); setShowRouteMenu(null); }}
              data-testid="button-tool-route"
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all",
                tool === 'route' ? "bg-cyan-500 text-black" : "text-cyan-400/60 hover:text-cyan-300 hover:bg-white/5")}
            >
              <Pen className="w-3 h-3" /> Route rajz
            </button>
          </div>

          <div className="w-px h-4 bg-cyan-500/20" />

          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-cyan-400/50 uppercase tracking-widest">+Játékos:</span>
            {(['WR', 'RB', 'TE', 'FB'] as PlayerType[]).map(t => (
              <button
                key={t}
                onClick={() => addPlayer(t)}
                data-testid={`button-add-${t.toLowerCase()}`}
                className="px-2 py-0.5 rounded text-[11px] font-bold border transition-colors hover:bg-white/10"
                style={{ color: PLAYER_CFG[t].color, borderColor: PLAYER_CFG[t].color + '40' }}
              >
                +{t}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-cyan-500/20" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400/50 uppercase">LOS:</span>
            <select
              value={losY}
              onChange={e => {
                const newLosY = Number(e.target.value);
                setPlay(p => {
                  const oldLosY = p.losY;
                  const dy = newLosY - oldLosY;
                  return {
                    ...p,
                    losY: newLosY,
                    players: p.players.map(pl =>
                      OL_TYPES.includes(pl.type) ? { ...pl, y: newLosY } : { ...pl, y: pl.y + dy }
                    ),
                    routes: p.routes.map(r => ({
                      ...r,
                      points: r.points.map(([x, y]) => [x, y + dy] as [number, number]),
                    })),
                  };
                });
              }}
              className="bg-black/60 border border-cyan-500/30 text-cyan-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-400"
              data-testid="select-los"
            >
              {LOS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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

        <div className="relative" ref={containerRef}>
          <svg
            ref={svgRef}
            viewBox={`0 ${viewMinY} ${W} ${H}`}
            className={cn("w-full rounded-xl border border-cyan-500/20 block select-none",
              tool === 'route' ? 'cursor-crosshair' : 'cursor-default')}
            style={{ background: '#0a0a0f', touchAction: 'none' }}
            onPointerDown={onSvgPointerDown}
            onPointerMove={onSvgPointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setMousePos(null)}
          >
            {(() => {
              const ezY = yToYard(0);
              if (ezY >= viewMinY && ezY <= viewMinY + H) return (
                <g>
                  <rect x={0} y={ezY - 2} width={W} height={20} fill="#22d3ee08" />
                  <text x={W / 2} y={ezY + 10} fill="#22d3ee" fontSize={10} fontFamily="monospace" textAnchor="middle" opacity={0.3} fontWeight="bold">
                    SAJÁT ENDZONE
                  </text>
                </g>
              );
              return null;
            })()}

            {Array.from({ length: 101 }, (_, i) => {
              const yd = i;
              const lineY = yToYard(yd);
              if (lineY < viewMinY || lineY > viewMinY + H) return null;
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

            <line x1={5} y1={viewMinY} x2={5} y2={viewMinY + H} stroke="#22d3ee" strokeWidth={2} opacity={0.15} />
            <line x1={W - 5} y1={viewMinY} x2={W - 5} y2={viewMinY + H} stroke="#22d3ee" strokeWidth={2} opacity={0.15} />

            {play.routes.map(route => {
              const player = play.players.find(p => p.id === route.playerId);
              if (!player) return null;
              return renderRoute(route, player);
            })}

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

            {play.players.map(player => {
              const cfg = PLAYER_CFG[player.type];
              const sel = selectedId === player.id;
              const isOL = OL_TYPES.includes(player.type);
              return (
                <g
                  key={player.id}
                  transform={`translate(${player.x},${player.y})`}
                  onPointerDown={(e) => onPlayerPointerDown(player, e)}
                  onPointerMove={onPlayerPointerMove}
                  onPointerUp={() => onPlayerPointerUp(player)}
                  style={{ cursor: tool === 'select' ? 'grab' : 'pointer', touchAction: 'none' }}
                  data-testid={`player-${player.id}`}
                >
                  {sel && <circle r={17} fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.8} />}
                  {isOL ? (
                    <rect x={-11} y={-11} width={22} height={22} fill={cfg.color} rx={3}
                      stroke={sel ? '#22d3ee' : cfg.stroke} strokeWidth={1.5} />
                  ) : (
                    <circle r={12} fill={cfg.color} stroke={sel ? '#22d3ee' : cfg.stroke} strokeWidth={1.5} />
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

          {tool === 'route' && selectedId && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {routePts && routePts.length > 0 ? (
                <>
                  <button onClick={finishRoute} data-testid="button-finish-route"
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-500 text-black text-xs font-bold rounded shadow">
                    <Check className="w-3 h-3" /> Kész
                  </button>
                  <button onClick={() => setRoutePts(null)}
                    className="flex items-center gap-1 px-2 py-1 bg-black/80 text-red-400 text-xs font-bold rounded border border-red-400/30">
                    <X className="w-3 h-3" /> Mégse
                  </button>
                </>
              ) : (
                <div className="px-2 py-1 bg-black/80 text-cyan-400/60 text-[10px] rounded border border-cyan-500/20">
                  Kattints a mezőre a route rajzolásához
                </div>
              )}
            </div>
          )}

          {showRouteMenu && selectedPlayer && isReceiver(selectedPlayer.type) && (
            <div
              data-route-menu
              className="absolute z-50 bg-black/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 py-1 min-w-[200px]"
              style={{
                left: Math.min(showRouteMenu.x + 20, (containerRef.current?.clientWidth || 400) - 220),
                top: Math.min(showRouteMenu.y - 60, (containerRef.current?.clientHeight || 400) - 300),
              }}
            >
              <div className="px-3 py-1.5 border-b border-cyan-500/15">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Route Tree</span>
              </div>
              {ROUTE_TREE.map(route => (
                <button
                  key={route.num}
                  onClick={() => applyRoute(route.num)}
                  data-testid={`button-route-${route.num}`}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded bg-cyan-500/15 text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {route.num}
                  </span>
                  <span className="text-foreground/90">{route.name}</span>
                </button>
              ))}
              <div className="border-t border-cyan-500/15 mt-1 pt-1">
                <button
                  onClick={startCustomRoute}
                  data-testid="button-route-custom"
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Pen className="w-3 h-3" />
                  </span>
                  <span className="text-foreground/90">Egyéni route rajz</span>
                </button>
                {play.routes.some(r => r.playerId === selectedId) && (
                  <button
                    onClick={clearRouteForSelected}
                    data-testid="button-clear-route"
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-400/80"
                  >
                    <span className="w-5 h-5 rounded bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </span>
                    Route törlése
                  </button>
                )}
              </div>
            </div>
          )}
        </div>


        <div className="flex gap-2">
          <Input
            value={playName}
            onChange={e => setPlayName(e.target.value)}
            placeholder="Play neve (pl. Slant Right, HB Counter...)"
            className="flex-1 bg-black/30 border-cyan-500/20 focus:border-cyan-400 h-9 text-sm"
            onKeyDown={e => { if (e.key === 'Enter' && playName.trim()) saveMutation.mutate(); }}
            data-testid="input-play-name"
          />
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !playName.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shrink-0"
            data-testid="button-save-play"
          >
            <Save className="w-4 h-4 mr-1" />
            {editingId ? 'Frissítés' : 'Mentés'}
          </Button>
        </div>
      </div>
    </div>
  );
}
