import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { usePosition } from "@/hooks/use-positions";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Utensils, Zap, Shield, Video, Plus, History, Save, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { DietCard } from "@/components/DietCard";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { lbsToDisplay, displayToLbs } from "@/lib/weight-conversion";

export default function PositionDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: position, isLoading } = usePosition(id || "");
  const [activeTab, setActiveTab] = useState<"gym" | "field" | "diet" | "film" | "tracking">("gym");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const weightUnit: "lbs" | "kg" = (user?.weightUnit as "lbs" | "kg") || "lbs";

  const weightUnitMutation = useMutation({
    mutationFn: async (unit: "lbs" | "kg") => {
      const res = await apiRequest("POST", "/api/user/weight-unit", { weightUnit: unit });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const { data: logs } = useQuery<any[]>({
    queryKey: [`/api/workout-logs/${id}`],
    enabled: !!id,
  });

  const { data: coachComments } = useQuery<any[]>({
    queryKey: [`/api/my-coach-comments/${id}`],
    enabled: !!id,
  });

  // Save this position as the athlete's selected position when they visit
  useEffect(() => {
    if (id) {
      apiRequest("POST", "/api/user/position", { positionId: id })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

    const mutation = useMutation({
      mutationFn: async (newLog: any) => {
        console.log("Sending log data:", newLog);
        const res = await apiRequest("POST", "/api/workout-logs", newLog);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || t("common:saveError"));
        }
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/workout-logs/${id}`] });
        toast({ title: t("weight:progressSaved"), description: t("weight:progressSavedDescription") });
      },
      onError: (error: any) => {
        console.error("Mutation error:", error);
        toast({ 
          title: t("common:saveErrorTitle"), 
          description: error.message || t("common:saveErrorDescription"),
          variant: "destructive"
        });
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded border-2 border-primary animate-spin" />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl text-destructive font-display mb-4">{t("common:positionNotFound")}</h1>
        <Link href="/" className="px-6 py-2 bg-secondary text-foreground rounded hover:bg-secondary/80">
          {t("common:returnToBase")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-sm hidden sm:block">{t("dashboard:selectPosition")}</span>
          </Link>
          
          <h1 className="text-2xl md:text-4xl font-display font-bold text-center text-foreground uppercase tracking-widest">
            {position.name}
          </h1>
          
          <div className="w-24 hidden sm:block" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        
        {/* Role Info */}
        <div className="mb-10 bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary p-6 rounded-r-lg">
          <h2 className="text-sm font-mono text-primary mb-2 uppercase tracking-wider">{t("dashboard:missionObjective")}</h2>
          <p className="text-lg text-foreground/90 max-w-3xl leading-relaxed">
            {position.roleInfo}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-card/50 rounded-xl border border-border inline-flex w-full md:w-auto">
          <TabButton 
            active={activeTab === "gym"} 
            onClick={() => setActiveTab("gym")}
            icon={<Shield className="w-4 h-4" />}
          >
            {t("weight:gymPlyo")}
          </TabButton>
          <TabButton 
            active={activeTab === "field"} 
            onClick={() => setActiveTab("field")}
            icon={<Zap className="w-4 h-4" />}
          >
            {t("weight:speedField")}
          </TabButton>
          <TabButton 
            active={activeTab === "diet"} 
            onClick={() => setActiveTab("diet")}
            icon={<Utensils className="w-4 h-4" />}
          >
            {t("weight:fuelNutrition")}
          </TabButton>
          <TabButton 
            active={activeTab === "film"} 
            onClick={() => setActiveTab("film")}
            icon={<Video className="w-4 h-4" />}
          >
            {t("weight:filmStudy")}
          </TabButton>
          <TabButton 
            active={activeTab === "tracking"} 
            onClick={() => setActiveTab("tracking")}
            icon={<History className="w-4 h-4" />}
          >
            {t("weight:weightTracking")}
          </TabButton>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "gym" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {position.workouts.gym.map((workout, idx) => (
                  <WorkoutCard key={idx} workout={workout} />
                ))}
              </div>
            )}

            {activeTab === "field" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {position.workouts.field.map((workout, idx) => (
                  <WorkoutCard key={idx} workout={workout} />
                ))}
              </div>
            )}

            {activeTab === "diet" && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    {position.diet.meals.map((meal, idx) => (
                      <DietCard key={idx} meal={meal} />
                    ))}
                  </div>
                  
                  {/* Protein Target Card */}
                  <div className="w-full md:w-80 shrink-0">
                    <div className="bg-gradient-to-b from-card to-background border border-primary/20 rounded-xl p-6 text-center neon-border">
                      <h3 className="text-muted-foreground text-sm uppercase font-bold mb-4">{t("dashboard:dailyProteinTarget")}</h3>
                      <div className="text-5xl font-display font-bold text-primary mb-2 text-glow">
                        {position.diet.proteinTarget}
                      </div>
                      <p className="text-sm text-foreground/60 mb-6">{t("dashboard:gramsPerDay")}</p>
                      
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4 rounded-full" />
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        {t("dashboard:proteinConsistency")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "film" && (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card/20 rounded-2xl border border-dashed border-primary/20">
                <Video className="w-16 h-16 text-primary/20 mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">{t("weight:filmStudyRoomTitle")}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t("weight:filmStudyDescription")}
                </p>
              </div>
            )}

            {activeTab === "tracking" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-display font-bold text-primary">{t("weight:progressTracking")}</h3>
                    <div className="flex items-center rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => weightUnitMutation.mutate("kg")}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold transition-all",
                          weightUnit === "kg" ? "bg-primary text-background" : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        KG
                      </button>
                      <button
                        onClick={() => weightUnitMutation.mutate("lbs")}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold transition-all",
                          weightUnit === "lbs" ? "bg-primary text-background" : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        LBS
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border">
                    <span className="text-sm font-mono uppercase text-muted-foreground">{t("weight:weekLabel")}</span>
                    {[1, 2, 3, 4, 5, 6].map(w => (
                      <button
                        key={w}
                        onClick={() => setSelectedWeek(w)}
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all",
                          selectedWeek === w ? "bg-primary text-black" : "hover:bg-white/10"
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6">
                  {position.workouts.gym.map((workout, wIdx) => (
                    <div key={wIdx} className="bg-card/30 rounded-xl border border-border overflow-hidden">
                      <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
                        <h4 className="font-bold text-primary uppercase text-sm tracking-widest">{workout.title}</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {workout.exercises.map((ex, exIdx) => {
                          const coachComment = coachComments?.find(
                            c => c.workoutTitle === workout.title && c.exerciseName === ex.name
                          );
                          return (
                            <div key={exIdx} className="border-b border-border/50 pb-4 last:border-0 last:pb-0 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div className="md:col-span-1">
                                  <p className="font-bold text-foreground">{ex.name}</p>
                                  <p className="text-xs text-muted-foreground">{t("weight:setsReps", { sets: ex.sets, reps: ex.reps })}</p>
                                </div>
                                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {Array.from({ length: parseInt(ex.sets) || 1 }).map((_, sIdx) => {
                                    const log = logs?.find(l =>
                                      l.week === selectedWeek &&
                                      l.workoutTitle === workout.title &&
                                      l.exerciseName === ex.name &&
                                      l.setIndex === sIdx
                                    );
                                    return (
                                      <div key={`${selectedWeek}-${sIdx}`} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-border/30">
                                        <span className="text-[10px] font-mono text-muted-foreground w-8">{t("weight:setLabel", { n: sIdx + 1 })}</span>
                                        <div className="relative flex-1">
                                          <Input
                                            key={`weight-${selectedWeek}-${sIdx}-${log?.id || 'new'}-${weightUnit}`}
                                            type="number"
                                            step={weightUnit === "kg" ? "0.1" : "1"}
                                            placeholder={t("weight:lbsPlaceholder")}
                                            defaultValue={log?.weight != null ? lbsToDisplay(log.weight, weightUnit) : ""}
                                            className="bg-black/50 border-primary/20 h-8 text-xs focus:border-primary pr-6"
                                            onBlur={(e) => {
                                              const rawVal = parseFloat(e.target.value);
                                              if (!isNaN(rawVal)) {
                                                const lbsVal = displayToLbs(rawVal, weightUnit);
                                                if (lbsVal !== (log?.weight || 0)) {
                                                  mutation.mutate({
                                                    positionId: id,
                                                    week: selectedWeek,
                                                    workoutTitle: workout.title,
                                                    exerciseName: ex.name,
                                                    setIndex: sIdx,
                                                    weight: lbsVal,
                                                    reps: log?.reps || 0
                                                  });
                                                }
                                              }
                                            }}
                                          />
                                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground pointer-events-none uppercase">
                                            {weightUnit}
                                          </span>
                                        </div>
                                        <div className="relative flex-1">
                                          <Input
                                            key={`reps-${selectedWeek}-${sIdx}-${log?.id || 'new'}`}
                                            type="number"
                                            placeholder={t("weight:repsPlaceholder")}
                                            defaultValue={log?.reps ?? ""}
                                            className="bg-black/50 border-accent/20 h-8 text-xs focus:border-accent pr-6"
                                            onBlur={(e) => {
                                              const val = parseInt(e.target.value);
                                              if (!isNaN(val) && val !== (log?.reps || 0)) {
                                                mutation.mutate({
                                                  positionId: id,
                                                  week: selectedWeek,
                                                  workoutTitle: workout.title,
                                                  exerciseName: ex.name,
                                                  setIndex: sIdx,
                                                  weight: log?.weight || 0,
                                                  reps: val
                                                });
                                              }
                                            }}
                                          />
                                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground pointer-events-none uppercase">reps</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Coach comment */}
                              {coachComment?.comment && (
                                <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-0.5">{t("weight:coachCommentLabel")}</p>
                                    <p className="text-sm text-foreground/90 leading-snug">{coachComment.comment}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({ 
  children, 
  active, 
  onClick, 
  icon 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200",
        active 
          ? "bg-primary text-background shadow-[0_0_15px_-3px_var(--primary)]" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
