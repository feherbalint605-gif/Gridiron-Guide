import { Link, useLocation } from "wouter";
import { usePositions } from "@/hooks/use-positions";
import { NeonCard } from "@/components/NeonCard";
import { motion } from "framer-motion";
import { 
  Trophy, 
  ChevronRight, 
  Search,
  Target,
  Zap,
  Shield,
  BicepsFlexed,
  Sword,
  ShieldAlert,
  FastForward
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const positionIcons: Record<string, any> = {
  qb: Target,
  wr: Zap,
  rb: FastForward,
  lb: ShieldAlert,
  db: Shield,
  ol: Sword,
  dl: BicepsFlexed
};

export default function Home() {
  const { data: positions, isLoading, error } = usePositions();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-primary font-display animate-pulse">Initializing Playbook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        Error loading positions. Please try refreshing.
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 font-mono text-sm tracking-widest uppercase">
              <Trophy className="w-4 h-4" />
              <span>Elite Training System</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 mb-6 drop-shadow-2xl tracking-tighter">
              GRIDIRON <br />
              <span className="text-glow text-primary italic">TRAINING</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-16 tracking-wide">
              ELITE ATHLETIC PERFORMANCE PROTOCOLS. <br/>
              DESIGNED FOR THE NEXT GENERATION OF BALLERS.
            </p>

            <div className="max-w-md mx-auto space-y-6 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <label className="block text-[10px] font-mono text-primary uppercase tracking-[0.3em] mb-3 opacity-80">System Access / Select Role</label>
                <Select onValueChange={(value) => setLocation(`/position/${value}`)}>
                  <SelectTrigger className="w-full bg-black/50 backdrop-blur-xl border-primary/30 text-foreground h-14 text-xl focus:ring-primary/50 rounded-none border-t-0 border-x-0 border-b-2 transition-all hover:border-primary">
                    <SelectValue placeholder="CHOOSE POSITION" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-2xl border-primary/20 text-foreground rounded-none">
                    {positions?.map((pos) => {
                      const Icon = positionIcons[pos.id] || Trophy;
                      return (
                        <SelectItem key={pos.id} value={pos.id} className="focus:bg-primary focus:text-black py-3 text-lg font-display uppercase tracking-wider cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            {pos.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
