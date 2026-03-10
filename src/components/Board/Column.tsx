import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Column as ColumnType, Task as TaskType } from '@/store/kanbanStore';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: TaskType[];
  index: number;
}

export function Column({ column, tasks, index }: ColumnProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Draggable draggableId={column.id} index={index} isDragDisabled={true}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex flex-col kanban-column w-[320px] shrink-0 h-[calc(100vh-10rem)] transition-all duration-300 ${snapshot.isDragging ? 'rotate-1 scale-[1.02] shadow-2xl z-50' : ''}`}
        >
          <div className="px-3 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-[0.1em] text-muted-foreground/80 truncate">{column.title}</h3>
              {index === 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  onClick={() => setIsModalOpen(true)}
                  title="Nova Tarefa"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <span className="bg-primary/10 text-primary text-[10px] py-0.5 px-2 rounded-full font-bold border border-primary/20 shrink-0">
              {tasks.length}
            </span>
          </div>

          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-1 overflow-y-auto px-1 py-2 space-y-4 transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-primary/5' : ''
                  } scrollbar-hide`}
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <TaskCard
                        task={task}
                        provided={provided}
                        isDragging={snapshot.isDragging}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}


              </div>
            )}
          </Droppable>

          <CreateTaskModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            columnId={column.id}
          />
        </div>
      )}
    </Draggable>
  );
}
