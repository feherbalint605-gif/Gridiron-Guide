import { Dumbbell, Clock, Activity, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NeonCard } from "./NeonCard";
import type { PositionDetails } from "@shared/schema";

interface WorkoutCardProps {
  workout: PositionDetails["workouts"]["gym"][0]; // Infer type from schema
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const { t } = useTranslation();
  return (
    <NeonCard hoverEffect={false} className="h-full bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {workout.type === "strength" && <Dumbbell className="w-5 h-5" />}
          {workout.type === "agility" && <Activity className="w-5 h-5" />}
          {workout.type === "technique" && <Clock className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{workout.title}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {workout.type} {t("common:focus")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {workout.exercises.map((exercise, idx) => (
          <div key={idx} className="group p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {exercise.name}
              </span>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {exercise.sets} x {exercise.reps}
              </span>
            </div>
            {exercise.notes && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{exercise.notes}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </NeonCard>
  );
}
