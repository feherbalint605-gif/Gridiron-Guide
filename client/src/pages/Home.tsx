import { Link, useLocation } from "wouter";
import { usePositions } from "@/hooks/use-positions";
import { NeonCard } from "@/components/NeonCard";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
            
            <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 mb-6 drop-shadow-lg">
              SELECT YOUR <br />
              <span className="text-glow text-primary">POSITION</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-12">
              Access professional-grade workout routines and nutrition plans tailored specifically 
              for your role on the field. Dominate your position.
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <label className="text-sm font-mono text-primary uppercase tracking-tighter">Choose your position:</label>
              <Select onValueChange={(value) => setLocation(`/position/${value}`)}>
                <SelectTrigger className="w-full bg-card border-primary/20 text-foreground h-12 text-lg focus:ring-primary/50">
                  <SelectValue placeholder="Select from list..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20 text-foreground">
                  {positions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id} className="focus:bg-primary/20 focus:text-primary">
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="container mx-auto max-w-6xl px-4 mt-12">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest px-4">OR EXPLORE ALL</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {positions?.map((pos) => (
            <motion.div key={pos.id} variants={item}>
              <Link href={`/position/${pos.id}`} className="block h-full group">
                <NeonCard className="h-full flex flex-col justify-between group-hover:bg-card/80">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                        {pos.name}
                      </h2>
                      <div className="p-2 rounded-full bg-background border border-border group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {pos.description}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-sm font-mono text-primary/80">
                    <span>VIEW PROTOCOLS</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </NeonCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
