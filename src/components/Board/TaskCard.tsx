import { useState } from 'react';
import type { Task } from '@/store/kanbanStore';
import type { DraggableProvided } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MessageSquare, User, Trash2 } from 'lucide-react';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useKanbanStore } from '@/store/kanbanStore';

interface TaskCardProps {
  task: Task;
  provided: DraggableProvided;
  isDragging: boolean;
}

export function TaskCard({ task, provided, isDragging }: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { deleteTask, boardMembers } = useKanbanStore();
  const creator = boardMembers.find(m => m.email === task.creatorEmail);
  const creatorDisplay = creator?.fullName || (task.creatorEmail ? task.creatorEmail.split('@')[0] : '');

  return (
    <>
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`relative group cursor-grab active:cursor-grabbing hover-lift glass-card border-border/40 rounded-xl transition-all duration-300 ${isDragging ? 'opacity-90 ring-2 ring-primary shadow-2xl z-50 scale-105 rotate-2' : ''
          }`}
        onClick={() => setIsModalOpen(true)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Deseja realmente excluir esta tarefa?')) {
              deleteTask(task.id);
            }
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 text-muted-foreground z-10"
          title="Remover tarefa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <CardContent className="p-4 space-y-4">
          <div className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
            {task.title}
          </div>

          {task.description && (
            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-border/30 mt-1">
            {task.creatorEmail && (
              <div className="flex items-center gap-1.5 max-w-[120px] truncate">
                <div className="p-1 rounded-full bg-muted border border-border/50">
                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate">{creatorDisplay}</span>
              </div>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary/70">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
                <Clock className="h-2.5 w-2.5" />
                <span>
                  {Math.floor(task.timeSpentMinutes / 60)}h {task.timeSpentMinutes % 60}m
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailsModal
        task={task}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
