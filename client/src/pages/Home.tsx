import { useState } from "react";
import { Link } from "wouter";
import { usePositions } from "@/hooks/use-positions";
import { usePosition } from "@/hooks/use-positions";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Target,
  Zap,
  FastForward,
  ShieldAlert,
  Shield,
  Sword,
  BicepsFlexed,
  BookOpen,
  Video,
  GraduationCap,
  Dumbbell,
  ChevronRight,
  RefreshCw,
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
  dl: BicepsFlexed,
};

function PositionSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: positions, isLoading } = usePositions();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-xs tracking-widest uppercase">
            <Trophy className="w-3.5 h-3.5" />
            <span>Athlete Dashboard</span>
          </div>
          <h1 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 tracking-tighter mt-4">
            GRIDIRON<br />
            <span className="text-primary italic">TRAINING</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Válaszd ki a pályán elfoglalt pozíciódat</p>
        </div>

        {isLoading ? (
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
        ) : (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <div className="relative">
              <label className="block text-[10px] font-mono text-primary uppercase tracking-[0.3em] mb-3 opacity-80">
                Pozíció kiválasztása
              </label>
              <Select onValueChange={onSelect}>
                <SelectTrigger
                  className="w-full bg-black/50 backdrop-blur-xl border-primary/30 h-14 text-lg focus:ring-primary/50 rounded-none border-t-0 border-x-0 border-b-2 transition-all hover:border-primary"
                  data-testid="select-position"
                >
                  <SelectValue placeholder="POZÍCIÓ VÁLASZTÁSA" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-2xl border-primary/20 rounded-none">
                  {positions?.map((pos) => {
                    const Icon = positionIcons[pos.id] || Trophy;
                    return (
                      <SelectItem
                        key={pos.id}
                        value={pos.id}
                        className="focus:bg-primary focus:text-black py-3 text-base font-display uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {pos.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const dashboardCards = [
  {
    id: "training",
    title: "Edzésterv",
    subtitle: "Heti workout & diéta terv",
    icon: Dumbbell,
    href: (posId: string) => `/position/${posId}`,
    accent: "from-primary/20 to-primary/5",
    border: "border-primary/30 hover:border-primary/60",
    iconColor: "text-primary",
    badge: "Terv",
  },
  {
    id: "playbook",
    title: "Playbook",
    subtitle: "Az edző által feltöltött playek",
    icon: BookOpen,
    href: () => "/playbook",
    accent: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/30 hover:border-cyan-500/60",
    iconColor: "text-cyan-400",
    badge: "Taktika",
  },
  {
    id: "film",
    title: "Film",
    subtitle: "Videóelemzés és felvételek",
    icon: Video,
    href: () => "/film",
    accent: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30 hover:border-purple-500/60",
    iconColor: "text-purple-400",
    badge: "Hamarosan",
    disabled: true,
  },
  {
    id: "study",
    title: "Study",
    subtitle: "Tananyagok és kvízek",
    icon: GraduationCap,
    href: () => "/study",
    accent: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30 hover:border-amber-500/60",
    iconColor: "text-amber-400",
    badge: "Hamarosan",
    disabled: true,
  },
];

function AthleteDashboard({
  positionId,
  onChangePosition,
}: {
  positionId: string;
  onChangePosition: () => void;
}) {
  const { data: position } = usePosition(positionId);
  const Icon = positionIcons[positionId] || Trophy;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="border-b border-border/50 bg-card/20 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            data-testid="badge-current-position"
          >
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest font-bold">
              {position?.name ?? positionId.toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={onChangePosition}
          data-testid="button-change-position"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
        >
          <RefreshCw className="w-3 h-3" />
          Pozíció váltás
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-xs font-mono text-primary/60 uppercase tracking-widest mb-1">Dashboard</h2>
          <h1 className="text-2xl font-display font-black text-foreground tracking-tight">
            Üdvözöljük,{" "}
            <span className="text-primary">
              {position?.name ?? positionId.toUpperCase()}
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dashboardCards.map((card) => {
            const CardIcon = card.icon;
            const href = card.href(positionId);
            const inner = (
              <div
                className={cn(
                  "relative group rounded-xl border bg-gradient-to-br p-5 transition-all duration-200",
                  card.accent,
                  card.border,
                  card.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30"
                )}
                data-testid={`card-${card.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2 rounded-lg bg-black/30", card.iconColor)}>
                    <CardIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground border border-border/50 rounded px-1.5 py-0.5">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-foreground text-base tracking-wide mb-0.5">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.subtitle}</p>
                {!card.disabled && (
                  <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                )}
              </div>
            );

            if (card.disabled) return <div key={card.id}>{inner}</div>;
            return (
              <Link key={card.id} href={href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const [changingPosition, setChangingPosition] = useState(false);

  const handleSelectPosition = async (id: string) => {
    try {
      await apiRequest("POST", "/api/user/position", { positionId: id });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch {}
    setChangingPosition(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const positionId = user?.selectedPositionId;

  if (!positionId || changingPosition) {
    return <PositionSelector onSelect={handleSelectPosition} />;
  }

  return (
    <AthleteDashboard
      positionId={positionId}
      onChangePosition={() => setChangingPosition(true)}
    />
  );
}
