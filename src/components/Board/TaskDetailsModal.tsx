import { useState, useEffect } from 'react';
import { useKanbanStore } from '@/store/kanbanStore';
import type { Task, Comment } from '@/store/kanbanStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Send, X } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({ task, open, onOpenChange }: TaskDetailsModalProps) {
  const { updateTask, userEmail } = useKanbanStore();

  // Local state for editing fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [hours, setHours] = useState(Math.floor(task.timeSpentMinutes / 60).toString());
  const [minutes, setMinutes] = useState((task.timeSpentMinutes % 60).toString());
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(task.comments || []);

  // Update effect if task changes externally
  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setHours(Math.floor(task.timeSpentMinutes / 60).toString());
      setMinutes((task.timeSpentMinutes % 60).toString());
      setComments(task.comments || []);
    }
  }, [task, open]);

  const handleSave = () => {
    if (!title.trim()) return;

    const timeSpentMinutes = (parseInt(hours || '0', 10) * 60) + parseInt(minutes || '0', 10);

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      timeSpentMinutes,
      comments
    });

    onOpenChange(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      authorId: '', // We can leave this empty or handle as needed, authorEmail is primary
      authorEmail: userEmail || 'usuário anônimo',
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment('');

    // Auto-save just the comment part to DB immediately as per usual chat pattern
    updateTask(task.id, { comments: updatedComments });
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    updateTask(task.id, { comments: updatedComments });
  };

  const handleCancel = () => {
    // Reset local state to task values
    setTitle(task.title);
    setDescription(task.description || '');
    setHours(Math.floor(task.timeSpentMinutes / 60).toString());
    setMinutes((task.timeSpentMinutes % 60).toString());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        // Just close without auto-saving now, user must click Save
        onOpenChange(false);
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent className="sm:max-w-[650px] h-[90vh] flex flex-col p-0 overflow-hidden glass-card border-white/10 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300">
        <DialogHeader className="px-8 py-6 border-b bg-muted/5 backdrop-blur-md shrink-0">
          <DialogTitle className="sr-only">Detalhes da Tarefa</DialogTitle>
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-1">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-bold tracking-tight border-none bg-transparent hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 px-3 h-auto py-1.5 -ml-3 rounded-xl transition-all"
              />
              <div className="flex items-center gap-2 mt-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Criado por</span>
                <span className="text-[10px] font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{task.creatorEmail}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-8">
          <div className="space-y-8">
            {/* Description */}
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Descrição do Projeto</Label>
              <Textarea
                placeholder="Adicione uma descrição mais detalhada..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none bg-muted/30 border-border/50 focus:bg-background/80 rounded-2xl p-4 text-sm leading-relaxed transition-all"
              />
            </div>

            {/* Time Tracking */}
            <div className="space-y-3 pt-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Monitoramento de Tempo</Label>
              <div className="flex items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-20 bg-background/50 border-border/50 focus:ring-primary/20 rounded-xl font-bold text-center h-11"
                    />
                    <div className="absolute -top-2 -right-1 bg-primary text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md text-white">HRS</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="w-20 bg-background/50 border-border/50 focus:ring-primary/20 rounded-xl font-bold text-center h-11"
                    />
                    <div className="absolute -top-2 -right-1 bg-indigo-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md text-white">MIN</div>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="text-[11px] font-bold text-muted-foreground/80 italic">
                  Total acumulado: {Math.floor(task.timeSpentMinutes / 60)}h {task.timeSpentMinutes % 60}m
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 pt-6 border-t border-border/30">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Feed de Discussão</Label>
              <div className="space-y-5">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
                    <p className="text-xs text-muted-foreground/60 font-medium">Nenhum comentário por enquanto.</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-widest font-bold">Seja o primeiro a interagir!</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-background/40 hover:bg-background/80 border border-border/40 hover:border-primary/20 rounded-2xl p-4 text-sm relative group transition-all duration-300">
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all text-muted-foreground"
                        title="Deletar comentário"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex justify-between items-start mb-2 pr-8">
                        <span className="font-bold text-[11px] text-primary tracking-tight">{comment.authorEmail.split('@')[0]}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                          {new Date(comment.createdAt).toLocaleDateString()} — {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-foreground/80 leading-relaxed text-xs">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Save/Cancel buttons */}
        <div className="p-6 border-t bg-muted/5 backdrop-blur-xl flex flex-col gap-6 shrink-0">
          <form className="flex gap-3" onSubmit={handleAddComment}>
            <Input
              placeholder="Digite uma mensagem ou atualização..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-background/60 border-border/50 focus:ring-primary/20 rounded-xl h-11 px-4"
            />
            <Button type="submit" size="icon" disabled={!newComment.trim()} className="h-11 w-11 rounded-xl shadow-lg hover-lift">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleCancel} className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest shadow-xl bg-primary hover:bg-primary/90 hover-lift">
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
