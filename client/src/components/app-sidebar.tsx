import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Position } from "@shared/schema";
import { type User } from "@shared/models/auth";
import { Link, useLocation } from "wouter";
import { Home, Video, BookOpen, ClipboardList, User as UserIcon, UserCheck, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar({ onSwitchRole }: { onSwitchRole: () => void }) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showJoinCoach, setShowJoinCoach] = useState(false);
  const [coachEmail, setCoachEmail] = useState("");

  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const joinCoachMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/user/join-coach", { email });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || i18n.t("nav:joinCoachError"));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowJoinCoach(false);
      setCoachEmail("");
      toast({ title: t("nav:joinCoachSuccess") });
    },
    onError: (err: any) => {
      toast({ title: t("common:error"), description: err.message, variant: "destructive" });
    },
  });

  const leaveCoachMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/leave-coach", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t("nav:leaveCoachSuccess") });
    },
  });

  const mainItems = [
    { title: t("nav:dashboard"), url: "/", icon: Home },
    { title: t("nav:playbook"), url: "/playbook", icon: ClipboardList },
    { title: t("nav:film"), url: "/film", icon: Video },
    { title: t("nav:study"), url: "/study", icon: BookOpen },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav:navigation")}</SidebarGroupLabel>
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
          <SidebarGroupLabel>{t("nav:myCoach")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              {user?.coachId ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <UserCheck className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-primary truncate">{t("nav:connected")}</p>
                    <button
                      onClick={() => leaveCoachMutation.mutate()}
                      disabled={leaveCoachMutation.isPending}
                      className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {t("nav:disconnect")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowJoinCoach(s => !s)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{t("nav:joinCoach")}</span>
                    <ChevronDown className={cn("w-3 h-3 ml-auto transition-transform", showJoinCoach && "rotate-180")} />
                  </button>

                  {showJoinCoach && (
                    <div className="space-y-2 px-1">
                      <Input
                        type="email"
                        placeholder={t("nav:coachEmailPlaceholder")}
                        value={coachEmail}
                        onChange={e => setCoachEmail(e.target.value)}
                        className="h-8 text-xs bg-black/40 border-primary/20 focus:border-primary"
                        onKeyDown={e => {
                          if (e.key === "Enter" && coachEmail.trim()) {
                            joinCoachMutation.mutate(coachEmail.trim());
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs bg-primary text-black font-bold hover:bg-primary/80"
                        disabled={!coachEmail.trim() || joinCoachMutation.isPending}
                        onClick={() => joinCoachMutation.mutate(coachEmail.trim())}
                      >
                        {joinCoachMutation.isPending ? t("common:connecting") : t("nav:join")}
                      </Button>
                    </div>
                  )}
                </>
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
            <p className="text-sm font-medium truncate">{user?.firstName || t("common:athlete")}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-primary mb-1"
          onClick={onSwitchRole}
        >
          {t("nav:switchRole")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          {t("nav:logout")}
        </Button>
      </div>
    </Sidebar>
  );
}
