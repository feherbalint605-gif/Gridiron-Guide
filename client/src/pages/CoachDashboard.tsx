import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, ChevronUp, Dumbbell, Utensils, BarChart3, User, Save, MessageSquare, Plus, Trash2, RefreshCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/models/auth";
import PlaybookEditor from "./PlaybookEditor";

type Tab = "workout" | "diet" | "tracking";

function AthleteCard({ athlete }: { athlete: UserType }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("workout");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [editablePlan, setEditablePlan] = useState<any>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const positionId = athlete.selectedPositionId;

  // Fetch plan (coach override or default)
  const { data: planData, isLoading: planLoading } = useQuery<any>({
    queryKey: [`/api/coach/athletes/${athlete.id}/plan/${positionId}`],
    enabled: open && !!positionId,
  });

  // Fetch athlete's workout logs
  const { data: logs } = useQuery<any[]>({
    queryKey: [`/api/coach/athletes/${athlete.id}/logs/${positionId}`],
    enabled: open && !!positionId && tab === "tracking",
  });

  // Fetch coach comments
  const { data: commentsData } = useQuery<any[]>({
    queryKey: [`/api/coach/athletes/${athlete.id}/comments/${positionId}`],
    enabled: open && !!positionId,
  });

  // Init editable plan when data loads
  useEffect(() => {
    if (planData && !editablePlan) {
      setEditablePlan(JSON.parse(JSON.stringify(planData)));
    }
  }, [planData]);

  // Init comment map when comments load
  useEffect(() => {
    if (commentsData) {
      const map: Record<string, string> = {};
      commentsData.forEach((c: any) => {
        map[`${c.workoutTitle}||${c.exerciseName}`] = c.comment;
      });
      setCommentMap(map);
    }
  }, [commentsData]);

  // Reset editable plan when closed or when athlete switches position
  useEffect(() => {
    if (!open) {
      setEditablePlan(null);
    }
  }, [open]);

  useEffect(() => {
    // When the athlete's position changes, reset so the new plan loads fresh
    setEditablePlan(null);
  }, [positionId]);

  // Save plan mutation — pass the plan explicitly to avoid stale closure
  const savePlanMutation = useMutation({
    mutationFn: async (planToSave: any) => {
      if (!planToSave) throw new Error("Nincs terv");
      const res = await apiRequest("POST", `/api/coach/athletes/${athlete.id}/plan/${positionId}`, planToSave);
      if (!res.ok) throw new Error("Mentési hiba");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coach/athletes/${athlete.id}/plan/${positionId}`] });
      toast({ title: "Edzésterv mentve!" });
    },
    onError: () => toast({ title: "Hiba a mentésnél", variant: "destructive" }),
  });

  // Save comment mutation
  const saveCommentMutation = useMutation({
    mutationFn: async ({ workoutTitle, exerciseName, comment }: { workoutTitle: string; exerciseName: string; comment: string }) => {
      const res = await apiRequest("POST", "/api/coach/comment", {
        athleteId: athlete.id, positionId, workoutTitle, exerciseName, comment
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coach/athletes/${athlete.id}/comments/${positionId}`] });
    },
  });

  const withBase = (prev: any) => JSON.parse(JSON.stringify(prev ?? planData ?? {}));

  const updateExercise = (wIdx: number, eIdx: number, field: string, value: string) => {
    setEditablePlan((prev: any) => {
      const next = withBase(prev);
      next.workouts.gym[wIdx].exercises[eIdx][field] = value;
      return next;
    });
  };

  const addExercise = (wIdx: number) => {
    setEditablePlan((prev: any) => {
      const next = withBase(prev);
      next.workouts.gym[wIdx].exercises.push({ name: "", sets: "3", reps: "10" });
      return next;
    });
  };

  const removeExercise = (wIdx: number, eIdx: number) => {
    setEditablePlan((prev: any) => {
      const next = withBase(prev);
      next.workouts.gym[wIdx].exercises.splice(eIdx, 1);
      return next;
    });
  };

  const updateWorkoutTitle = (wIdx: number, title: string) => {
    setEditablePlan((prev: any) => {
      const next = withBase(prev);
      next.workouts.gym[wIdx].title = title;
      return next;
    });
  };

  const addWorkoutDay = () => {
    setEditablePlan((prev: any) => {
      const next = withBase(prev);
      if (!next.workouts) next.workouts = {};
      if (!next.workouts.gym) next.workouts.gym = [];
      next.workouts.gym.push({ type: "strength", title: "Új edzésnap", exercises: [] });
      return next;
    });
  };

  const removeWorkoutDay = (wIdx: number) => {
    setEditablePlan((prev: any) => {
      const next = withBase(prev);
      next.workouts.gym.splice(wIdx, 1);
      return next;
    });
  };

  const updateProtein = (value: string) => {
    setEditablePlan((prev: any) => ({ ...prev, diet: { ...prev.diet, proteinTarget: value } }));
  };

  const updateMealItem = (mIdx: number, iIdx: number, value: string) => {
    setEditablePlan((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.diet.meals[mIdx].items[iIdx] = value;
      return next;
    });
  };

  const addMealItem = (mIdx: number) => {
    setEditablePlan((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.diet.meals[mIdx].items.push("");
      return next;
    });
  };

  const removeMealItem = (mIdx: number, iIdx: number) => {
    setEditablePlan((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.diet.meals[mIdx].items.splice(iIdx, 1);
      return next;
    });
  };

  const plan = editablePlan || planData;
  const displayName = [athlete.firstName, athlete.lastName].filter(Boolean).join(" ") || athlete.email || "Ismeretlen játékos";

  return (
    <div className="bg-card/30 border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{athlete.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {positionId ? (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono uppercase tracking-wider">
              {positionId}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-muted/20 text-muted-foreground text-xs">Nincs pozíció</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {!positionId ? (
              <div className="px-4 pb-6 text-center text-muted-foreground text-sm py-6">
                Ez a játékos még nem választott pozíciót.
              </div>
            ) : (
              <div className="px-4 pb-4">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-4 border-t border-border/50 pt-4">
                  {([["workout", <Dumbbell className="w-4 h-4" />, "Edzésterv"],
                     ["diet", <Utensils className="w-4 h-4" />, "Étrend"],
                     ["tracking", <BarChart3 className="w-4 h-4" />, "Weight Tracking"]] as const).map(([key, icon, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key as Tab)}
                      className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        tab === key ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {planLoading || !plan ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* ── WORKOUT TAB ── */}
                    {tab === "workout" && (
                      <div className="space-y-4">
                        {(editablePlan?.workouts?.gym ?? plan.workouts?.gym ?? []).map((workout: any, wIdx: number) => (
                          <div key={wIdx} className="bg-black/20 rounded-lg border border-border/30 overflow-hidden">
                            {/* Day header — editable title + delete day */}
                            <div className="bg-primary/10 px-3 py-2 border-b border-primary/20 flex items-center gap-2">
                              <Input
                                className="h-7 flex-1 text-xs font-bold bg-transparent border-transparent hover:border-primary/30 focus:border-primary text-primary uppercase tracking-widest px-1"
                                value={workout.title}
                                onChange={e => updateWorkoutTitle(wIdx, e.target.value)}
                              />
                              <button
                                onClick={() => removeWorkoutDay(wIdx)}
                                className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                title="Edzésnap törlése"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-3 space-y-2">
                              {/* Header row */}
                              <div className="grid grid-cols-[1fr_52px_52px_28px] gap-2 text-[10px] text-muted-foreground uppercase tracking-widest px-1">
                                <span>Gyakorlat</span>
                                <span className="text-center">Szett</span>
                                <span className="text-center">Ismétlés</span>
                                <span />
                              </div>

                              {workout.exercises?.map((ex: any, eIdx: number) => (
                                <div key={eIdx} className="grid grid-cols-[1fr_52px_52px_28px] gap-2 items-center">
                                  <Input
                                    className="h-8 text-xs bg-black/40 border-border/30 focus:border-primary"
                                    value={ex.name}
                                    onChange={e => updateExercise(wIdx, eIdx, "name", e.target.value)}
                                    placeholder="Gyakorlat neve..."
                                  />
                                  <Input
                                    className="h-8 text-xs bg-black/40 border-border/30 focus:border-primary text-center"
                                    value={ex.sets}
                                    onChange={e => updateExercise(wIdx, eIdx, "sets", e.target.value)}
                                  />
                                  <Input
                                    className="h-8 text-xs bg-black/40 border-border/30 focus:border-primary text-center"
                                    value={ex.reps}
                                    onChange={e => updateExercise(wIdx, eIdx, "reps", e.target.value)}
                                  />
                                  <button
                                    onClick={() => removeExercise(wIdx, eIdx)}
                                    className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Add exercise */}
                              <button
                                onClick={() => addExercise(wIdx)}
                                className="flex items-center gap-2 w-full mt-1 px-2 py-1.5 rounded border border-dashed border-primary/20 text-primary/50 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-xs"
                              >
                                <Plus className="w-3.5 h-3.5" /> Gyakorlat hozzáadása
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add workout day */}
                        <button
                          onClick={addWorkoutDay}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed border-primary/30 text-primary/60 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-all text-sm font-bold"
                        >
                          <Plus className="w-4 h-4" /> Edzésnap hozzáadása
                        </button>

                        <Button
                          onClick={() => savePlanMutation.mutate(editablePlan ?? planData)}
                          disabled={savePlanMutation.isPending || (!editablePlan && !planData)}
                          className="w-full bg-primary text-black font-bold hover:bg-primary/80"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savePlanMutation.isPending ? "Mentés..." : "Edzésterv mentése"}
                        </Button>
                      </div>
                    )}

                    {/* ── DIET TAB ── */}
                    {tab === "diet" && (
                      <div className="space-y-4">
                        {/* Protein target */}
                        <div className="flex items-center gap-4 bg-black/20 rounded-lg p-3 border border-border/30">
                          <span className="text-xs font-mono text-primary uppercase tracking-widest flex-1">Napi fehérje cél</span>
                          <div className="flex items-center gap-2">
                            <Input
                              className="w-20 h-8 text-sm bg-black/40 border-primary/20 focus:border-primary text-center font-bold"
                              value={editablePlan?.diet?.proteinTarget ?? plan.diet?.proteinTarget ?? ""}
                              onChange={e => updateProtein(e.target.value)}
                            />
                            <span className="text-sm text-primary font-bold">g</span>
                          </div>
                        </div>

                        {plan.diet?.meals?.map((meal: any, mIdx: number) => (
                          <div key={mIdx} className="bg-black/20 rounded-lg border border-border/30 overflow-hidden">
                            <div className="bg-primary/5 px-3 py-2 border-b border-border/20">
                              <h4 className="font-bold text-foreground text-sm">{meal.meal}</h4>
                            </div>
                            <div className="p-3 space-y-2">
                              {(editablePlan?.diet?.meals?.[mIdx]?.items ?? meal.items)?.map((item: string, iIdx: number) => (
                                <div key={iIdx} className="flex items-center gap-2">
                                  <Input
                                    className="flex-1 h-7 text-xs bg-black/40 border-border/30 focus:border-primary"
                                    value={item}
                                    onChange={e => updateMealItem(mIdx, iIdx, e.target.value)}
                                  />
                                  <button
                                    onClick={() => removeMealItem(mIdx, iIdx)}
                                    className="text-muted-foreground hover:text-destructive text-xs px-1"
                                  >✕</button>
                                </div>
                              ))}
                              <button
                                onClick={() => addMealItem(mIdx)}
                                className="text-xs text-primary/60 hover:text-primary transition-colors mt-1"
                              >
                                + Étel hozzáadása
                              </button>
                            </div>
                          </div>
                        ))}

                        <Button
                          onClick={() => savePlanMutation.mutate(editablePlan ?? planData)}
                          disabled={savePlanMutation.isPending || (!editablePlan && !planData)}
                          className="w-full bg-primary text-black font-bold hover:bg-primary/80"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savePlanMutation.isPending ? "Mentés..." : "Étrend mentése"}
                        </Button>
                      </div>
                    )}

                    {/* ── TRACKING TAB ── */}
                    {tab === "tracking" && (
                      <div className="space-y-4">
                        {/* Week selector */}
                        <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border w-fit">
                          <span className="text-xs font-mono uppercase text-muted-foreground">Hét:</span>
                          {[1,2,3,4,5,6].map(w => (
                            <button
                              key={w}
                              onClick={() => setSelectedWeek(w)}
                              className={cn("w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all",
                                selectedWeek === w ? "bg-primary text-black" : "hover:bg-white/10 text-muted-foreground"
                              )}
                            >
                              {w}
                            </button>
                          ))}
                        </div>

                        {plan.workouts?.gym?.map((workout: any, wIdx: number) => (
                          <div key={wIdx} className="bg-black/20 rounded-lg border border-border/30 overflow-hidden">
                            <div className="bg-primary/10 px-3 py-2 border-b border-primary/20">
                              <h4 className="font-bold text-primary text-xs uppercase tracking-widest">{workout.title}</h4>
                            </div>
                            <div className="p-3 space-y-4">
                              {workout.exercises?.map((ex: any, eIdx: number) => {
                                const exLogs = logs?.filter(l =>
                                  l.week === selectedWeek &&
                                  l.workoutTitle === workout.title &&
                                  l.exerciseName === ex.name
                                ) || [];
                                const commentKey = `${workout.title}||${ex.name}`;
                                return (
                                  <div key={eIdx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-foreground">{ex.name}</span>
                                      <span className="text-xs text-muted-foreground font-mono">{ex.sets}×{ex.reps}</span>
                                    </div>

                                    {/* Athlete's log data */}
                                    <div className="grid grid-cols-3 gap-2">
                                      {Array.from({ length: parseInt(ex.sets) || 1 }).map((_, sIdx) => {
                                        const log = exLogs.find(l => l.setIndex === sIdx);
                                        return (
                                          <div key={sIdx} className="bg-black/30 rounded px-2 py-1 flex items-center gap-2 border border-border/20">
                                            <span className="text-[9px] text-muted-foreground font-mono">S{sIdx + 1}</span>
                                            {log ? (
                                              <span className="text-xs text-foreground font-mono">{log.weight}lbs × {log.reps}</span>
                                            ) : (
                                              <span className="text-xs text-muted-foreground/40">–</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Coach comment */}
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="w-3.5 h-3.5 text-primary/50 mt-2 shrink-0" />
                                      <Textarea
                                        placeholder="Edző komment ehhez a feladathoz..."
                                        className="text-xs bg-black/30 border-primary/10 focus:border-primary/40 min-h-[56px] resize-none"
                                        value={commentMap[commentKey] ?? ""}
                                        onChange={e => setCommentMap(prev => ({ ...prev, [commentKey]: e.target.value }))}
                                        onBlur={e => {
                                          saveCommentMutation.mutate({
                                            workoutTitle: workout.title,
                                            exerciseName: ex.name,
                                            comment: e.target.value,
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CoachDashboard({ onSwitchRole }: { onSwitchRole: () => void }) {
  const [coachTab, setCoachTab] = useState<'athletes' | 'playbook'>('athletes');
  const { data: athletes, isLoading, refetch } = useQuery<UserType[]>({
    queryKey: ["/api/coach/athletes"],
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-display font-black text-primary italic mb-1">COACH PORTAL</h1>
          </div>
          <div className="flex items-center gap-2">
            {coachTab === 'athletes' && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest border border-border rounded px-3 py-2"
                title="Frissítés"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Frissítés
              </button>
            )}
            <button
              onClick={onSwitchRole}
              className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest border border-border rounded px-3 py-2"
            >
              Szerepkör váltás
            </button>
          </div>
        </div>

        {/* Top-level tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCoachTab('athletes')}
            data-testid="button-tab-athletes"
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
              coachTab === 'athletes' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-border")}
          >
            <Users className="w-4 h-4" /> Játékosok
          </button>
          <button
            onClick={() => setCoachTab('playbook')}
            data-testid="button-tab-playbook"
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
              coachTab === 'playbook' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-border")}
          >
            <BookOpen className="w-4 h-4" /> Playbook
          </button>
        </div>

        {coachTab === 'playbook' ? (
          <PlaybookEditor />
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : !athletes || athletes.length === 0 ? (
              <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-primary/20">
                <Users className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Még nincs játékos</h2>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                  Azok a játékosok jelennek meg itt, akik csatlakoztak hozzád az athlete felületen.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{athletes.length} játékos csatlakozott</p>
                {athletes.map(athlete => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
