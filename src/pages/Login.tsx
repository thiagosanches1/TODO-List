import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
        title="Entrar"
        description="Acesse sua conta para gerenciar suas tarefas"
        footer={
          <div className="text-sm text-gray-500 text-center w-full mt-4">
            Não tem uma conta? <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Cadastre-se</Link>
          </div>
        }
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-950/50 rounded-lg text-center font-medium border border-red-200 dark:border-red-900">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/50 dark:bg-gray-900/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/50 dark:bg-gray-900/50"
            />
          </div>
          <Button type="submit" className="w-full h-11 text-md shadow-lg transition-transform active:scale-[0.98]" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </AuthCard>
    </AuthBackground>
  );
}
