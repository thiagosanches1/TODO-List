import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutDashboard, Plus, Trash2, Users, Loader2, Edit2, Columns } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Board {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

export function AdminBoardManagement() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create board state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');

  // Manage members state
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [boardMembers, setBoardMembers] = useState<string[]>([]);

  // Edit board state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [boardsRes, profilesRes] = await Promise.all([
      supabase.from('boards').select('*').order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, email, full_name').order('email', { ascending: true }),
    ]);

    if (boardsRes.data) {
      // Fetch member counts
      const boardsWithCounts = await Promise.all(
        boardsRes.data.map(async (b: any) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact', head: true })
            .eq('board_id', b.id);
          return {
            id: b.id,
            name: b.name,
            description: b.description || '',
            memberCount: count || 0,
          };
        })
      );
      setBoards(boardsWithCounts);
    }

    if (profilesRes.data) {
      setProfiles(profilesRes.data);
    }

    setLoading(false);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from('boards').insert({
        name: boardName.trim(),
        description: boardDescription.trim(),
      });
      if (error) throw error;
      setSuccess(`Board "${boardName}" criado com sucesso!`);
      setBoardName('');
      setBoardDescription('');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    if (!confirm(`Tem certeza que deseja excluir o board "${board.name}"? Todas as colunas e tasks associadas serão perdidas.`)) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('boards').delete().eq('id', board.id);
      if (error) throw error;
      setSuccess(`Board "${board.name}" excluído.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMembersModal = async (board: Board) => {
    setSelectedBoard(board);
    setIsMembersOpen(true);

    // Load current members
    const { data } = await supabase
      .from('board_members')
      .select('user_id')
      .eq('board_id', board.id);

    setBoardMembers((data || []).map((m: any) => m.user_id));
  };

  const toggleMember = (userId: string) => {
    setBoardMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveMembers = async () => {
    if (!selectedBoard) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Delete all current members for this board
      await supabase.from('board_members').delete().eq('board_id', selectedBoard.id);

      // Insert new members
      if (boardMembers.length > 0) {
        const inserts = boardMembers.map(userId => ({
          board_id: selectedBoard.id,
          user_id: userId,
        }));
        const { error } = await supabase.from('board_members').insert(inserts);
        if (error) throw error;
      }

      setSuccess(`Membros do board "${selectedBoard.name}" atualizados!`);
      setIsMembersOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar membros');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (board: Board) => {
    setEditingBoard(board);
    setEditName(board.name);
    setEditDescription(board.description || '');
    setIsEditOpen(true);
  };

  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard || !editName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('boards')
        .update({ name: editName.trim(), description: editDescription.trim() })
        .eq('id', editingBoard.id);
      if (error) throw error;
      setSuccess(`Board "${editName}" atualizado!`);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar board');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Boards</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          Criar Board
        </Button>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="p-3 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {/* Board List */}
      <Card className="shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Boards Cadastrados
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Total: {boards.length} board{boards.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : boards.length === 0 ? (
            <div className="p-12 text-center">
              <LayoutDashboard className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-sm">Nenhum board cadastrado.</p>
              <p className="text-muted-foreground/70 text-xs mt-1">Use o botão "Criar Board" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3 text-center">Membros</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {boards.map((board) => (
                    <tr key={board.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold">{board.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{board.description || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {board.memberCount} membro{board.memberCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/boards/${board.id}`)}
                            className="h-8 px-3 gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Columns className="h-3.5 w-3.5" />
                            Colunas
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMembersModal(board)}
                            className="h-8 px-3 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Membros
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(board)}
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Editar board"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBoard(board)}
                            disabled={isSubmitting}
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

      {/* Create Board Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Novo Board
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBoard} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Nome do Board</Label>
              <Input
                id="boardName"
                placeholder="Ex: Infraestrutura"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardDescription">Descrição (opcional)</Label>
              <Input
                id="boardDescription"
                placeholder="Breve descrição do board"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !boardName.trim()}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Board'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Membros — {selectedBoard?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-72 overflow-y-auto">
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário cadastrado.</p>
            ) : (
              profiles.map((profile) => (
                <label
                  key={profile.id}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer border border-transparent hover:border-border transition-colors"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={boardMembers.includes(profile.id)}
                    onChange={() => toggleMember(profile.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembersOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMembers} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Membros'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Board Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" />
              Editar Board
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBoard} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editBoardName">Nome do Board</Label>
              <Input
                id="editBoardName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBoardDescription">Descrição (opcional)</Label>
              <Input
                id="editBoardDescription"
                placeholder="Breve descrição do board"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !editName.trim()}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
