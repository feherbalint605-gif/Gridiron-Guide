import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-10 rounded-2xl border border-border shadow-2xl">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground">404 Play Not Found</h1>
        
        <p className="text-muted-foreground">
          The playbook page you're looking for doesn't exist or has been moved to a different formation.
        </p>

        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-background bg-primary rounded-lg hover:bg-primary/90 transition-colors w-full">
          Return to Huddle
        </Link>
      </div>
    </div>
  );
}
