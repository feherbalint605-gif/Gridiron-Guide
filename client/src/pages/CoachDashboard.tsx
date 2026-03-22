import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, ChevronUp, Dumbbell, Utensils, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@shared/models/auth";

type Tab = "workout" | "diet" | "tracking";

function WeekBadge({ w, selected, onClick }: { w: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all",
        selected ? "bg-primary text-black" : "hover:bg-white/10 text-muted-foreground"
      )}
    >
      {w}
    </button>
  );
}

function AthleteCard({ athlete }: { athlete: UserType }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("workout");
  const [selectedWeek, setSelectedWeek] = useState(1);

  const positionId = athlete.selectedPositionId;

  const { data: positionData } = useQuery<any>({
    queryKey: [`/api/positions/${positionId}`],
    enabled: open && !!positionId,
  });

  const { data: logs } = useQuery<any[]>({
    queryKey: [`/api/coach/athletes/${athlete.id}/logs/${positionId}`],
    enabled: open && !!positionId && tab === "tracking",
  });

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
              <div className="px-4 pb-4 text-center text-muted-foreground text-sm py-6">
                Ez a játékos még nem választott pozíciót.
              </div>
            ) : (
              <div className="px-4 pb-4">
                {/* Tab bar */}
                <div className="flex gap-2 mb-4 border-t border-border/50 pt-4">
                  <button
                    onClick={() => setTab("workout")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      tab === "workout" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Dumbbell className="w-4 h-4" /> Edzésterv
                  </button>
                  <button
                    onClick={() => setTab("diet")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      tab === "diet" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Utensils className="w-4 h-4" /> Étrend
                  </button>
                  <button
                    onClick={() => setTab("tracking")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      tab === "tracking" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <BarChart3 className="w-4 h-4" /> Weight Tracking
                  </button>
                </div>

                {!positionData ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {tab === "workout" && (
                      <div className="space-y-4">
                        {positionData.workouts?.gym?.map((workout: any, wIdx: number) => (
                          <div key={wIdx} className="bg-black/20 rounded-lg border border-border/30 overflow-hidden">
                            <div className="bg-primary/10 px-3 py-2 border-b border-primary/20">
                              <h4 className="font-bold text-primary text-xs uppercase tracking-widest">{workout.title}</h4>
                            </div>
                            <div className="p-3 space-y-2">
                              {workout.exercises?.map((ex: any, eIdx: number) => (
                                <div key={eIdx} className="flex items-center justify-between text-sm">
                                  <span className="text-foreground/80">{ex.name}</span>
                                  <span className="text-muted-foreground font-mono text-xs">{ex.sets}x{ex.reps}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tab === "diet" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-primary uppercase tracking-widest">Napi fehérje cél</span>
                          <span className="text-2xl font-display font-bold text-primary">{positionData.diet?.proteinTarget}g</span>
                        </div>
                        {positionData.diet?.meals?.map((meal: any, mIdx: number) => (
                          <div key={mIdx} className="bg-black/20 rounded-lg border border-border/30 p-3">
                            <h4 className="font-bold text-foreground text-sm mb-2">{meal.meal}</h4>
                            <ul className="space-y-1">
                              {meal.items?.map((item: string, iIdx: number) => (
                                <li key={iIdx} className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {tab === "tracking" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border w-fit">
                          <span className="text-xs font-mono uppercase text-muted-foreground">Hét:</span>
                          {[1,2,3,4,5,6].map(w => (
                            <WeekBadge key={w} w={w} selected={selectedWeek === w} onClick={() => setSelectedWeek(w)} />
                          ))}
                        </div>
                        {positionData.workouts?.gym?.map((workout: any, wIdx: number) => (
                          <div key={wIdx} className="bg-black/20 rounded-lg border border-border/30 overflow-hidden">
                            <div className="bg-primary/10 px-3 py-2 border-b border-primary/20">
                              <h4 className="font-bold text-primary text-xs uppercase tracking-widest">{workout.title}</h4>
                            </div>
                            <div className="p-3 space-y-3">
                              {workout.exercises?.map((ex: any, eIdx: number) => {
                                const exLogs = logs?.filter(l =>
                                  l.week === selectedWeek &&
                                  l.workoutTitle === workout.title &&
                                  l.exerciseName === ex.name
                                ) || [];
                                return (
                                  <div key={eIdx}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-bold text-foreground">{ex.name}</span>
                                      <span className="text-xs text-muted-foreground font-mono">{ex.sets}x{ex.reps}</span>
                                    </div>
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
  const { data: athletes, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/coach/athletes"],
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-black text-primary italic mb-1">COACH PORTAL</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-sm">Játékosok áttekintése</p>
          </div>
          <button
            onClick={onSwitchRole}
            className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest border border-border rounded px-3 py-2"
          >
            Szerepkör váltás
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !athletes || athletes.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-primary/20">
            <Users className="w-16 h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Még nincs játékos</h2>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Azok a játékosok jelennek meg itt, akik csatlakoztak hozzád. A játékosok az athlete felületen tudnak hozzád csatlakozni.
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
      </div>
    </div>
  );
}
