import { useState, useEffect } from 'react';
import { useKanbanStore } from '@/store/kanbanStore';
import { MemberSelector } from './MemberSelector';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
}

export function CreateTaskModal({ open, onOpenChange, columnId }: CreateTaskModalProps) {
  const { addTask, tasks, userEmail, currentBoardId, boardMembers } = useKanbanStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
  const [storyPoints, setStoryPoints] = useState('0');

  useEffect(() => {
    if (open) {
      // Reset assigned and story points every time the modal opens
      setAssignedTo(undefined);
      setStoryPoints('0');
    }
  }, [open]);

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
      assignedTo: assignedTo,
      storyPoints: parseInt(storyPoints || '0', 10),
      createdAt: new Date().toISOString(),
    });

    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[98vw] sm:w-[96vw] sm:max-w-[96vw] lg:w-[94vw] lg:max-w-[94vw] xl:w-[92vw] xl:max-w-[92vw] max-h-[92vh] h-[92vh] flex flex-col p-0 overflow-hidden glass-card border-white/10 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader className="px-8 py-6 border-b bg-muted/5 backdrop-blur-md shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight">Nova Tarefa</DialogTitle>
          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mt-1">Defina as bases do seu próximo passo</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col p-8 overflow-auto">
          <div className="space-y-6">
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
                className="resize-none min-h-[280px] p-4 bg-muted/30 border-border/50 focus:bg-background/80 rounded-xl transition-all text-sm leading-relaxed"
                rows={12}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Atribuído a</Label>
              <div>
                <MemberSelector
                  members={boardMembers}
                  selectedMemberId={assignedTo}
                  onSelect={(id) => setAssignedTo(id)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Pontos da História</Label>
              <Input
                type="number"
                min="0"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="h-12 px-4 bg-muted/30 border-border/50 focus:bg-background/80 rounded-xl transition-all"
              />
            </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/30 mt-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest">
                Cancelar
              </Button>
              <Button type="submit" disabled={!title.trim()} className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest shadow-xl bg-primary hover:bg-primary/90 hover-lift">
                Adicionar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
