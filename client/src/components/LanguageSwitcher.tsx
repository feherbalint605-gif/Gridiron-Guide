import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-black/30 p-0.5">
      <Button
        variant={i18n.language === "hu" ? "default" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs font-bold"
        onClick={() => i18n.changeLanguage("hu")}
        aria-label="Magyar"
      >
        HU
      </Button>
      <Button
        variant={i18n.language === "en" ? "default" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs font-bold"
        onClick={() => i18n.changeLanguage("en")}
        aria-label="English"
      >
        EN
      </Button>
    </div>
  );
}
