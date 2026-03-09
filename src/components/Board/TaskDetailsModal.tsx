import { useState, useEffect } from 'react';
import { useKanbanStore } from '@/store/kanbanStore';
import type { Task, Comment } from '@/store/kanbanStore';
import { supabase } from '@/lib/supabase';
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
  const { updateTask } = useKanbanStore();
  
  // Local state for editing fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [hours, setHours] = useState(Math.floor(task.timeSpentMinutes / 60).toString());
  const [minutes, setMinutes] = useState((task.timeSpentMinutes % 60).toString());
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || '');
      setUserEmail(data.user?.email || '');
    });
  }, []);

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
      authorId: userId,
      authorEmail: userEmail,
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
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="sr-only">Detalhes da Tarefa</DialogTitle>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="text-lg font-semibold border-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-0 px-2 h-auto py-1 -ml-2"
          />
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground font-semibold">Descrição</Label>
              <Textarea
                placeholder="Adicione uma descrição mais detalhada..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Time Tracking */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                <Clock className="w-4 h-4" />
                <Label>Tempo Gasto</Label>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm">horas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0"
                    max="59"
                    placeholder="0"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-muted-foreground font-semibold">Comentários</Label>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum comentário ainda.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-3 text-sm relative group">
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all text-muted-foreground"
                        title="Deletar comentário"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex justify-between items-start mb-1 pr-6">
                        <span className="font-semibold text-xs text-primary">{comment.authorEmail}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Save/Cancel buttons */}
        <div className="p-4 border-t flex items-center justify-between bg-white dark:bg-gray-950">
          <div className="flex-1 mr-4">
            <form className="flex gap-2" onSubmit={handleAddComment}>
              <Input 
                placeholder="Escreva um comentário..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-gray-50 dark:bg-gray-900"
              />
              <Button type="submit" size="icon" disabled={!newComment.trim()} variant="ghost">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
