import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Optional auto-redirect, generally signup might require email confirmation in Supabase.
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <AuthBackground>
      <AuthCard
        title="Criar Conta"
        description="Junte-se a nós para organizar seu fluxo de trabalho"
        footer={
          <div className="text-sm text-gray-500 text-center mt-4">
            Já possui uma conta? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Faça login</Link>
          </div>
        }
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-950/50 rounded-lg text-center font-medium border border-red-200 dark:border-red-900">{error}</div>}
          {success && <div className="text-green-500 text-sm p-3 bg-green-50 dark:bg-green-950/50 rounded-lg text-center font-medium border border-green-200 dark:border-green-900">Conta criada! Você será redirecionado.</div>}
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
              minLength={6}
              className="bg-white/50 dark:bg-gray-900/50"
            />
          </div>
          <Button type="submit" className="w-full h-11 text-md shadow-lg transition-transform active:scale-[0.98]" disabled={loading || success}>
            {loading ? "Criando conta..." : "Cadastrar"}
          </Button>
        </form>
      </AuthCard>
    </AuthBackground>
  );
}
