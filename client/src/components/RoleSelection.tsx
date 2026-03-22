import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/NeonCard";
import { motion } from "framer-motion";
import { User, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function RoleSelection({ onSelect }: { onSelect: (role: string) => void }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (role: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await apiRequest("POST", "/api/user/role", { role });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onSelect(role);
    } catch (error) {
      console.error("Failed to update role", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 dark">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-display font-black text-primary mb-4 italic">
            CHOOSE YOUR PATH
          </h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">
            Select your role to access the gridiron
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('athlete')}
          >
            <NeonCard className="p-8 cursor-pointer border-2 border-transparent hover:border-primary transition-all bg-black/40 h-full flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Athlete</h2>
                <p className="text-muted-foreground text-sm">Access training protocols, diet plans, and track your progress.</p>
              </div>
              <Button className="w-full bg-primary text-black font-bold hover:bg-primary/80" disabled={isUpdating}>
                SELECT ATHLETE
              </Button>
            </NeonCard>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('coach')}
          >
            <NeonCard className="p-8 cursor-pointer border-2 border-transparent hover:border-accent transition-all bg-black/40 h-full flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center border border-accent/30">
                <ShieldCheck className="w-10 h-10 text-accent" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Coach</h2>
                <p className="text-muted-foreground text-sm">Manage roster, review athlete progress, and update protocols.</p>
              </div>
              <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-black font-bold" disabled={isUpdating}>
                SELECT COACH
              </Button>
            </NeonCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
