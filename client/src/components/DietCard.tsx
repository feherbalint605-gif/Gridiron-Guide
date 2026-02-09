import { Utensils, CheckCircle2 } from "lucide-react";
import { NeonCard } from "./NeonCard";
import type { PositionDetails } from "@shared/schema";

interface DietCardProps {
  meal: PositionDetails["diet"]["meals"][0];
}

export function DietCard({ meal }: DietCardProps) {
  return (
    <NeonCard hoverEffect={false} className="bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
            <Utensils className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{meal.meal}</h3>
        </div>
        {(meal.calories || meal.protein) && (
          <div className="text-right text-xs text-muted-foreground font-mono">
            {meal.calories && <div>{meal.calories} kcal</div>}
            {meal.protein && <div className="text-primary">{meal.protein} protein</div>}
          </div>
        )}
      </div>

      <ul className="space-y-3">
        {meal.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-foreground/90">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </NeonCard>
  );
}
