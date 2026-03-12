import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { type Position } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Home, Trophy, User, Video, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function AppSidebar({ onSwitchRole }: { onSwitchRole: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const mainItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Film", url: "/film", icon: Video },
    { title: "Study", url: "/study", icon: BookOpen },
  ];

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
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
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
          Switch Role
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start" 
          onClick={() => logout()}
        >
          Log out
        </Button>
      </div>
    </Sidebar>
  );
}
