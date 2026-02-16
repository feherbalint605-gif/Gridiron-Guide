import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import PositionDetail from "@/pages/PositionDetail";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/position/:id" component={PositionDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  if (!isAuthenticated) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full bg-background text-foreground dark">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h1 className="text-xl font-bold tracking-tighter text-primary">GRIDIRON TRAINING</h1>
                </div>
              </header>
              <main className="flex-1 overflow-y-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
