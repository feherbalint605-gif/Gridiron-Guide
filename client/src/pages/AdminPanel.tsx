import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout", {});
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 dark">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Admin Panel</h1>
        <Button variant="outline" onClick={handleLogout}>Kijelentkezés</Button>
      </div>
      <p className="text-muted-foreground">Hamarosan: userek listája, szerkesztés, tiltás.</p>
    </div>
  );
}
