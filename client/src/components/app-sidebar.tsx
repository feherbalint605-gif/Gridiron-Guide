import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Position } from "@shared/schema";
import { type User } from "@shared/models/auth";
import { Link, useLocation } from "wouter";
import { Home, Video, BookOpen, User as UserIcon, UserCheck, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AppSidebar({ onSwitchRole }: { onSwitchRole: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [showJoinCoach, setShowJoinCoach] = useState(false);

  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: coaches } = useQuery<User[]>({
    queryKey: ["/api/coaches"],
    enabled: showJoinCoach || !!user?.coachId,
  });

  const joinCoachMutation = useMutation({
    mutationFn: async (coachId: string) => {
      const res = await apiRequest("POST", "/api/user/join-coach", { coachId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowJoinCoach(false);
    },
  });

  const mainItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Film", url: "/film", icon: Video },
    { title: "Study", url: "/study", icon: BookOpen },
  ];

  const currentCoach = coaches?.find(c => c.id === user?.coachId);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Coach section */}
        <SidebarGroup>
          <SidebarGroupLabel>Edzőm</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              {user?.coachId && currentCoach ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <UserCheck className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary truncate">
                      {[currentCoach.firstName, currentCoach.lastName].filter(Boolean).join(" ") || currentCoach.email}
                    </p>
                    <button
                      onClick={() => joinCoachMutation.mutate("")}
                      className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Lecsatlakozás
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinCoach(s => !s)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Csatlakozás edzőhöz</span>
                  <ChevronDown className={cn("w-3 h-3 ml-auto transition-transform", showJoinCoach && "rotate-180")} />
                </button>
              )}

              {showJoinCoach && !user?.coachId && (
                <div className="space-y-1 pl-1">
                  {!coaches ? (
                    <p className="text-xs text-muted-foreground px-2">Töltés...</p>
                  ) : coaches.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2">Nincs elérhető edző.</p>
                  ) : (
                    coaches.map(coach => (
                      <button
                        key={coach.id}
                        onClick={() => joinCoachMutation.mutate(coach.id)}
                        disabled={joinCoachMutation.isPending}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <p className="font-medium truncate">
                          {[coach.firstName, coach.lastName].filter(Boolean).join(" ") || "Coach"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{coach.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName || "Athlete"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-primary mb-1"
          onClick={onSwitchRole}
        >
          Szerepkör váltás
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          Kijelentkezés
        </Button>
      </div>
    </Sidebar>
  );
}
