import { useState } from 'react';
import { useKanbanStore } from '@/store/kanbanStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
}

export function CreateTaskModal({ open, onOpenChange, columnId }: CreateTaskModalProps) {
  const { addTask, tasks, userEmail, currentBoardId } = useKanbanStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentBoardId) return;

    const columnTasksCount = tasks.filter(t => t.status === columnId).length;

    addTask({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status: columnId,
      order: columnTasksCount,
      comments: [],
      timeSpentMinutes: 0,
      creatorEmail: userEmail || '',
      boardId: currentBoardId,
    });

    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden glass-card border-white/10 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader className="px-8 py-6 border-b bg-muted/5 backdrop-blur-md">
          <DialogTitle className="text-xl font-bold tracking-tight">Nova Tarefa</DialogTitle>
          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mt-1">Defina as bases do seu próximo passo</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Título da Tarefa</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
              className="h-12 px-4 bg-muted/30 border-border/50 focus:bg-background/80 rounded-xl transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Descrição adicional</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione mais detalhes ou contextos..."
              className="resize-none min-h-[100px] p-4 bg-muted/30 border-border/50 focus:bg-background/80 rounded-xl transition-all"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest">
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim()} className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest shadow-xl bg-primary hover:bg-primary/90 hover-lift">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
