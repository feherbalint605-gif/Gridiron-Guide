import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Send, Users, ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "wouter";

interface TeamInfo {
  id: number;
  name: string;
  coachId: string;
  members: { id: string; firstName: string | null; lastName: string | null; email: string | null }[];
}

interface Msg {
  id: number;
  teamId: number;
  authorId: string;
  content: string;
  createdAt: string;
}

function memberName(m: { firstName: string | null; lastName: string | null; email: string | null }) {
  return [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || "Játékos";
}

function authorLabel(authorId: string, team: TeamInfo | undefined): string {
  if (!team) return "Ismeretlen";
  if (authorId === team.coachId) return "Edző";
  const m = team.members.find(x => x.id === authorId);
  return m ? memberName(m) : "Ismeretlen";
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
      {initials}
    </div>
  );
}

interface Props {
  teamIdOverride?: number;
  onBack?: () => void;
}

export default function TeamChat({ teamIdOverride, onBack }: Props = {}) {
  const params = useParams<{ id: string }>();
  const teamId = teamIdOverride ?? parseInt(params?.id || "0");
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCoach = user?.role === "coach";

  const { data: team } = useQuery<TeamInfo>({
    queryKey: ["/api/team", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/team/${teamId}`);
      if (!res.ok) throw new Error("Nem található");
      return res.json();
    },
    enabled: !!teamId,
  });

  const { data: messages = [], isLoading } = useQuery<Msg[]>({
    queryKey: ["/api/team/messages", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/team/${teamId}/messages`);
      if (!res.ok) throw new Error("Nem sikerült betölteni");
      return res.json();
    },
    enabled: !!teamId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/team/${teamId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/messages", teamId] });
      setDraft("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const myId = (user as any)?.claims?.sub ?? user?.id;

  const BackButton = () => {
    if (onBack) {
      return (
        <button onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
      );
    }
    return (
      <Link href="/">
        <button className="text-muted-foreground hover:text-primary transition-colors" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm px-4 py-3 flex items-center gap-3 shrink-0">
        <BackButton />
        <div className="flex items-center gap-2 flex-1">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground">{team?.name ?? "Csapat üzenőfal"}</span>
        </div>
        {team && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{team.members.length} tag</span>
          </div>
        )}
      </header>

      {team && (
        <div className="flex gap-1.5 px-4 py-2 border-b border-border/30 overflow-x-auto shrink-0 bg-card/10">
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">E</div>
            <span className="text-[10px] text-primary whitespace-nowrap font-bold">Edző</span>
          </div>
          {team.members.map(m => (
            <div key={m.id} className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5">
              <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[8px] font-bold text-cyan-400">
                {memberName(m)[0]?.toUpperCase()}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{memberName(m)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Még nincs üzenet. Legyél az első!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.authorId === myId;
          const name = authorLabel(msg.authorId, team);
          const isCoachMsg = msg.authorId === team?.coachId;
          return (
            <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
              <Avatar name={name} />
              <div className={cn("max-w-[72%] space-y-0.5 flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-1.5">
                  {!isMe && (
                    <span className={cn("text-[10px] font-mono font-bold", isCoachMsg ? "text-primary" : "text-cyan-400")}>
                      {name}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className={cn(
                  "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  isMe
                    ? "bg-primary/20 border border-primary/30 rounded-tr-sm"
                    : "bg-card/60 border border-border/50 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/50 bg-card/20 px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end max-w-2xl mx-auto">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Írj üzenetet... (Enter = küldés)"
            rows={1}
            data-testid="input-message"
            className="flex-1 bg-black/30 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 min-h-[40px]"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            data-testid="button-send-message"
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              draft.trim() && !sendMutation.isPending
                ? "bg-primary text-black hover:bg-primary/80"
                : "bg-card/30 text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
