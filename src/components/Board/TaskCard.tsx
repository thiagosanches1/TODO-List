import { useState } from 'react';
import type { Task } from '@/store/kanbanStore';
import type { DraggableProvided } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MessageSquare } from 'lucide-react';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskCardProps {
  task: Task;
  provided: DraggableProvided;
  isDragging: boolean;
}

export function TaskCard({ task, provided, isDragging }: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <CardContent className="p-4 space-y-3">
          <div className="font-medium text-sm leading-tight text-gray-900 dark:text-gray-100">
            {task.title}
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.comments.length}</span>
              </div>
            )}
            {task.timeSpentMinutes > 0 && (
               <div className="flex items-center gap-1">
                 <Clock className="h-3 w-3" />
                 <span>{(task.timeSpentMinutes / 60).toFixed(1)}h</span>
               </div>
            )}
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
