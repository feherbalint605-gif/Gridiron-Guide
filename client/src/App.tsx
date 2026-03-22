import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import PositionDetail from "@/pages/PositionDetail";
import CoachDashboard from "@/pages/CoachDashboard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import RoleSelection from "@/components/RoleSelection";

function AthleteRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/position/:id" component={PositionDetail} />
      <Route path="/film">
        <div className="p-8 text-center text-muted-foreground">Film content coming soon...</div>
      </Route>
      <Route path="/study">
        <div className="p-8 text-center text-muted-foreground">Study material coming soon...</div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary font-bold animate-pulse">
        GRIDIRON TRAINING...
      </div>
    );
  }

  if (isAuthenticated && showRoleSelect) {
    return <RoleSelection onSelect={() => setShowRoleSelect(false)} />;
  }

  const isCoach = user?.role === "coach";

  if (isAuthenticated && isCoach) {
    return (
      <div className="dark bg-background min-h-screen text-foreground">
        <CoachDashboard onSwitchRole={() => setShowRoleSelect(true)} />
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background text-foreground dark">
        {isAuthenticated && <AppSidebar onSwitchRole={() => setShowRoleSelect(true)} />}
        <div className="flex flex-col flex-1 overflow-hidden">
          {isAuthenticated && (
            <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-xl font-bold tracking-tighter text-primary">GRIDIRON TRAINING</h1>
              </div>
            </header>
          )}
          <main className="flex-1 overflow-y-auto">
            <AthleteRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
