import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-10 rounded-2xl border border-border shadow-2xl">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground">{t("common:notFoundTitle")}</h1>
        
        <p className="text-muted-foreground">
          {t("common:notFoundDescription")}
        </p>

        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-background bg-primary rounded-lg hover:bg-primary/90 transition-colors w-full">
          {t("common:returnHome")}
        </Link>
      </div>
    </div>
  );
}
