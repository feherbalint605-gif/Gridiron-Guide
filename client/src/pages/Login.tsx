import { useState } from "react";
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

type Mode = "login" | "register";

export default function Login() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 dark">
        <div className="fixed top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-black text-primary mb-2 italic" data-testid="text-app-title">
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
