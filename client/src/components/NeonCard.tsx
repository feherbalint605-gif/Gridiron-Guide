import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export function NeonCard({ children, className, onClick, hoverEffect = true }: NeonCardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl bg-card border border-border p-6",
        "transition-all duration-300",
        hoverEffect && "hover:border-primary/60 hover:shadow-[0_0_20px_-5px_hsla(var(--primary),0.3)] cursor-pointer",
        className
      )}
    >
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Content wrapper to stay above background */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
    </motion.div>
  );
}
