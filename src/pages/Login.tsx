import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <AuthBackground>
      <AuthCard
        title="Bem-vindo"
        description="Acesse sua conta para organizar seu fluxo de trabalho"
      >
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-xl text-center font-semibold border border-destructive/20 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-background/50 border-border/50 rounded-xl focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-background/50 border-border/50 rounded-xl focus:ring-primary/20 transition-all"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-md font-bold rounded-xl shadow-lg shadow-primary/20 hover-lift mt-2" disabled={loading}>
            {loading ? "Processando..." : "Acessar Painel"}
          </Button>
        </form>
      </AuthCard>
    </AuthBackground>
  );
}
