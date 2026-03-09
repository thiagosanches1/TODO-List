import { useEffect, useState } from 'react';
import { useKanbanStore } from '@/store/kanbanStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
}

export function CreateTaskModal({ open, onOpenChange, columnId }: CreateTaskModalProps) {
  const { addTask, tasks } = useKanbanStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '');
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const columnTasksCount = tasks.filter(t => t.status === columnId).length;

    addTask({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status: columnId,
      order: columnTasksCount,
      comments: [],
      timeSpentMinutes: 0,
      creatorEmail: userEmail,
    });

    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione mais detalhes..."
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
