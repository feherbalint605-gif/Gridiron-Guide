import { useParams, Link } from "wouter";
import { usePosition } from "@/hooks/use-positions";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Utensils, Zap, Shield, Video, Plus, History, Save } from "lucide-react";
import { useState } from "react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { DietCard } from "@/components/DietCard";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function PositionDetail() {
  const { id } = useParams();
  const { data: position, isLoading } = usePosition(id || "");
  const [activeTab, setActiveTab] = useState<"gym" | "field" | "diet" | "film" | "tracking">("gym");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { toast } = useToast();

  const { data: logs } = useQuery<any[]>({
    queryKey: [`/api/workout-logs/${id}`],
    enabled: !!id,
  });

    const mutation = useMutation({
      mutationFn: async (newLog: any) => {
        const res = await apiRequest("POST", "/api/workout-logs", newLog);
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/workout-logs/${id}`] });
        toast({ title: "Haladás mentve!", description: "A fejlődésed rögzítettük." });
      },
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
        <h1 className="text-2xl text-destructive font-display mb-4">POSITION NOT FOUND</h1>
        <Link href="/" className="px-6 py-2 bg-secondary text-foreground rounded hover:bg-secondary/80">
          Return to Base
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
            <span className="font-mono text-sm hidden sm:block">SELECT POSITION</span>
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
          <h2 className="text-sm font-mono text-primary mb-2 uppercase tracking-wider">Mission Objective</h2>
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
            Gym & Plyo
          </TabButton>
          <TabButton 
            active={activeTab === "field"} 
            onClick={() => setActiveTab("field")}
            icon={<Zap className="w-4 h-4" />}
          >
            Speed & Field
          </TabButton>
          <TabButton 
            active={activeTab === "diet"} 
            onClick={() => setActiveTab("diet")}
            icon={<Utensils className="w-4 h-4" />}
          >
            Fuel & Nutrition
          </TabButton>
          <TabButton 
            active={activeTab === "film"} 
            onClick={() => setActiveTab("film")}
            icon={<Video className="w-4 h-4" />}
          >
            Film & Study
          </TabButton>
          <TabButton 
            active={activeTab === "tracking"} 
            onClick={() => setActiveTab("tracking")}
            icon={<History className="w-4 h-4" />}
          >
            Weight Tracking
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
                      <h3 className="text-muted-foreground text-sm uppercase font-bold mb-4">Daily Protein Target</h3>
                      <div className="text-5xl font-display font-bold text-primary mb-2 text-glow">
                        {position.diet.proteinTarget}
                      </div>
                      <p className="text-sm text-foreground/60 mb-6">Grams per day</p>
                      
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4 rounded-full" />
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Consistent intake is crucial for muscle recovery and growth.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "film" && (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card/20 rounded-2xl border border-dashed border-primary/20">
                <Video className="w-16 h-16 text-primary/20 mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">FILM & STUDY ROOM</h3>
                <p className="text-muted-foreground max-w-md">
                  This section is currently being prepared by the coaching staff. 
                  Check back soon for game film analysis and tactical playbooks.
                </p>
              </div>
            )}

            {activeTab === "tracking" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-primary">Progress Tracking</h3>
                  <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border">
                    <span className="text-sm font-mono uppercase text-muted-foreground">Week:</span>
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
                        {workout.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-border/50 pb-4 last:border-0 last:pb-0">
                            <div className="md:col-span-1">
                              <p className="font-bold text-foreground">{ex.name}</p>
                              <p className="text-xs text-muted-foreground">{ex.sets} sets x {ex.reps} reps</p>
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
                                    <span className="text-[10px] font-mono text-muted-foreground w-8">SET {sIdx + 1}</span>
                                    <div className="relative flex-1">
                                      <Input
                                        key={`weight-${selectedWeek}-${sIdx}`}
                                        type="number"
                                        placeholder="lbs"
                                        defaultValue={log?.weight || ""}
                                        className="bg-black/50 border-primary/20 h-8 text-xs focus:border-primary pr-6"
                                        onBlur={(e) => {
                                          const val = parseInt(e.target.value);
                                          // Allow 0 or empty string by checking for NaN
                                          if (!isNaN(val) && val !== (log?.weight || 0)) {
                                            mutation.mutate({
                                              positionId: id,
                                              week: selectedWeek,
                                              workoutTitle: workout.title,
                                              exerciseName: ex.name,
                                              setIndex: sIdx,
                                              weight: val,
                                              reps: log?.reps || parseInt(ex.reps) || 0
                                            });
                                          }
                                        }}
                                      />
                                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground pointer-events-none uppercase">lbs</span>
                                    </div>
                                    <div className="relative flex-1">
                                      <Input
                                        key={`reps-${selectedWeek}-${sIdx}`}
                                        type="number"
                                        placeholder="reps"
                                        defaultValue={log?.reps || ""}
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
                        ))}
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
