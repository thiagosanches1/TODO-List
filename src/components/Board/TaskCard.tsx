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
  const { deleteTask } = useKanbanStore();

  return (
    <>
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`relative group cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-primary/50 transition-shadow ${
          isDragging ? 'opacity-90 ring-2 ring-primary shadow-xl rotate-2' : 'shadow-sm'
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
          className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all text-muted-foreground z-10"
          title="Remover tarefa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <CardContent className="p-4 space-y-3">
          <div className="font-medium text-sm leading-tight text-gray-900 dark:text-gray-100">
            {task.title}
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
            {task.creatorEmail && (
              <div className="flex items-center gap-1 max-w-[120px] truncate">
                <User className="h-3 w-3" />
                <span className="truncate">{task.creatorEmail}</span>
              </div>
            )}
            <div className="flex-1" />
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.comments.length}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {Math.floor(task.timeSpentMinutes / 60)}h {task.timeSpentMinutes % 60}m
              </span>
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
