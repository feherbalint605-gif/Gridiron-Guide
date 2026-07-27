import { useState, useEffect, useRef } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeonCard } from "@/components/NeonCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminPanel from "@/pages/AdminPanel";

type Mode = "login" | "register";
type AdminView = "hidden" | "credentials" | "code" | "panel";

export default function Login() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

  // ── Admin belépés (rejtett) ──
  const [titleClicks, setTitleClicks] = useState(0);
  const [adminView, setAdminView] = useState<AdminView>("hidden");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminAttemptId, setAdminAttemptId] = useState("");
  const [adminError, setAdminError] = useState("");
  const titleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/admin/check", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setAdminView("panel");
      })
      .catch(() => {});
  }, []);

  const handleTitleClick = () => {
    const next = titleClicks + 1;
    setTitleClicks(next);

    // Ha 10 másodpercig nincs újabb kattintás, a számláló nullázódik
    if (titleClickTimer.current) {
      clearTimeout(titleClickTimer.current);
    }
    titleClickTimer.current = setTimeout(() => {
      setTitleClicks(0);
    }, 10000);

    if (next >= 8) {
      if (titleClickTimer.current) {
        clearTimeout(titleClickTimer.current);
      }
      setAdminView("credentials");
      setTitleClicks(0);
    }
  };

  const handleAdminRequestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    if (adminPassword !== adminPasswordConfirm) {
      setAdminError("A két jelszó nem egyezik.");
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/admin/request-login", {
        email: adminEmail,
        password: adminPassword,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Hiba történt.");
      }
      const data = await res.json();
      setAdminAttemptId(data.attemptId);
      setAdminView("code");
    } catch (err: any) {
      setAdminError(err.message);
    }
  };

  const handleAdminVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    try {
      const res = await apiRequest("POST", "/api/admin/verify-login", {
        attemptId: adminAttemptId,
        code: adminCode,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Hiba történt.");
      }
      setAdminView("panel");
    } catch (err: any) {
      setAdminError(err.message);
    }
  };

  const authMutation = useMutation({
    mutationFn: async () => {
      const path = mode === "login" ? "/api/login" : "/api/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, firstName, lastName };
      const res = await apiRequest("POST", path, payload);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
    onError: (error: Error) => {
      const message = error.message.replace(/^\d+:\s*/, "");
      let text = message;
      try {
        text = JSON.parse(message).message ?? message;
      } catch {
        // not JSON, use raw message
      }
      toast({
        title: mode === "login" ? t("auth:loginFailed") : t("auth:registerFailed"),
        description: text,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate();
  };

  if (adminView === "panel") {
    return <AdminPanel onLogout={() => setAdminView("hidden")} />;
  }

  if (adminView === "credentials" || adminView === "code") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 dark">
        <div className="max-w-md w-full">
          <NeonCard className="p-8 bg-black/40">
            <h2 className="text-xl font-display font-bold text-primary mb-6 text-center uppercase tracking-widest">
              Admin belépés
            </h2>

            {adminView === "credentials" && (
              <form onSubmit={handleAdminRequestLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail">E-mail</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword">Jelszó</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPasswordConfirm">Jelszó megerősítése</Label>
                  <Input
                    id="adminPasswordConfirm"
                    type="password"
                    required
                    value={adminPasswordConfirm}
                    onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                  />
                </div>
                {adminError && <p className="text-sm text-destructive">{adminError}</p>}
                <Button type="submit" className="w-full bg-primary text-black font-bold hover:bg-primary/80">
                  Kód kérése
                </Button>
                <button
                  type="button"
                  onClick={() => setAdminView("hidden")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Mégse
                </button>
              </form>
            )}

            {adminView === "code" && (
              <form onSubmit={handleAdminVerifyCode} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Elküldtük a 6 jegyű kódot az e-mail címedre.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="adminCode">Kód</Label>
                  <Input
                    id="adminCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                  />
                </div>
                {adminError && <p className="text-sm text-destructive">{adminError}</p>}
                <Button type="submit" className="w-full bg-primary text-black font-bold hover:bg-primary/80">
                  Belépés
                </Button>
                <button
                  type="button"
                  onClick={() => setAdminView("hidden")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Mégse
                </button>
              </form>
            )}
          </NeonCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 dark">
        <div className="fixed top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1
            onClick={handleTitleClick}
            className="text-4xl md:text-5xl font-display font-black text-primary mb-2 italic cursor-default select-none"
            data-testid="text-app-title"
          >
            GRIDIRON TRAINING
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            {mode === "login" ? t("auth:loginSubtitle") : t("auth:registerSubtitle")}
          </p>
        </motion.div>

        <NeonCard className="p-8 bg-black/40">
          <div className="flex gap-2 mb-6 bg-black/30 rounded-md p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              data-testid="button-mode-login"
              className={`flex-1 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${
                mode === "login" ? "bg-primary text-black" : "text-muted-foreground"
              }`}
            >
              {t("auth:login")}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              data-testid="button-mode-register"
              className={`flex-1 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${
                mode === "register" ? "bg-primary text-black" : "text-muted-foreground"
              }`}
            >
              {t("auth:register")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">{t("auth:firstName")}</Label>
                    <Input
                      id="firstName"
                      data-testid="input-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("auth:placeholderFirstName")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">{t("auth:lastName")}</Label>
                    <Input
                      id="lastName"
                      data-testid="input-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("auth:placeholderLastName")}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth:email")}</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth:placeholderEmail")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth:password")}</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {mode === "register" && (
                  <p className="text-xs text-muted-foreground">{t("auth:passwordHint")}</p>
                )}
              </div>

              <Button
                type="submit"
                data-testid="button-submit"
                className="w-full bg-primary text-black font-bold hover:bg-primary/80 mt-2"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending
                  ? t("common:loading")
                  : mode === "login"
                  ? t("auth:signIn")
                  : t("auth:signUp")}
              </Button>
            </motion.form>
          </AnimatePresence>
        </NeonCard>
      </div>
    </div>
  );
}
