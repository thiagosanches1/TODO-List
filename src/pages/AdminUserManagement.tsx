import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserPlus, Shield, Mail, User, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useKanbanStore } from '@/store/kanbanStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
}

export function AdminUserManagement() {
  const navigate = useNavigate();
  const { isAdmin } = useKanbanStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isNewAdmin, setIsNewAdmin] = useState(false);

  // Edit state
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real production app with Supabase, we would use an Edge Function 
      // or the Management API to create users with a password.
      // Since we are in a dev environment and for simplicity, we use auth.signUp()
      // Note: This will create a user and potentially log them in or send confirmation email depending on Supabase settings.
      // A more robust admin approach uses a Security Definer function or Edge Function.
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            is_admin: isNewAdmin
          }
        }
      });

      if (signUpError) throw signUpError;

      setSuccess(`Usuário ${email} criado com sucesso!`);
      setEmail('');
      setPassword('');
      setFullName('');
      setIsNewAdmin(false);
      setIsCreateDialogOpen(false);
      fetchProfiles();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (profile: Profile) => {
    setEditingProfile(profile);
    setEditName(profile.full_name || '');
    setEditIsAdmin(profile.is_admin);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          is_admin: editIsAdmin
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      setSuccess(`Perfil de ${editingProfile.email} atualizado!`);
      setIsEditDialogOpen(false);
      fetchProfiles();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (profile.email === 'thiago@admin.com') {
      setError('O administrador principal não pode ser excluído.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${profile.email}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Deletar da tabela profiles primeiro (o trigger/cascade cuida do resto se configurado, 
      // ou usamos a função admin_delete_user que criamos)
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        target_user_id: profile.id
      });

      if (rpcError) throw rpcError;

      setSuccess(`Usuário ${profile.email} removido.`);
      fetchProfiles();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <Button onClick={() => navigate('/')}>Voltar para o Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 shadow-md">
            <UserPlus className="h-4 w-4" />
            Criar Usuário
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* User List - Full Width */}
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Usuários Cadastrados</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Total: {profiles.length} usuários
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-medium border-b">
                      <tr>
                        <th className="px-6 py-3">Nome</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3 text-center">Admin</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {profiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{profile.full_name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{profile.email}</td>
                          <td className="px-6 py-4 text-center">
                            {profile.is_admin ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                Sim
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Não</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditClick(profile)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteUser(profile)}
                                disabled={profile.email === 'thiago@admin.com'}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Adicionar Novo Usuário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome Completo
              </Label>
              <Input
                id="fullName"
                placeholder="João Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isAdmin"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={isNewAdmin}
                onChange={(e) => setIsNewAdmin(e.target.checked)}
              />
              <Label htmlFor="isAdmin" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4 text-primary" />
                Usuário Administrador
              </Label>
            </div>

            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editingProfile?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">Nome Completo</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="editAdmin"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={editIsAdmin}
                onChange={(e) => setEditIsAdmin(e.target.checked)}
                disabled={editingProfile?.email === 'thiago@admin.com'}
              />
              <Label htmlFor="editAdmin" className="cursor-pointer">
                Usuário Administrador
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
