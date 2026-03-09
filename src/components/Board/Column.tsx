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
  isEditMode: boolean;
}

export function Column({ column, tasks, index, isEditMode }: ColumnProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Draggable draggableId={column.id} index={index} isDragDisabled={!isEditMode}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex flex-col bg-gray-200/50 dark:bg-gray-800/50 w-[320px] shrink-0 rounded-xl h-[calc(100vh-8rem)] ${snapshot.isDragging ? 'opacity-75 ring-2 ring-primary -rotate-2 shadow-xl' : ''}`}
        >
          <div 
            {...provided.dragHandleProps} 
            className={`p-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 rounded-t-xl transition-colors ${
              isEditMode ? 'cursor-grab active:cursor-grabbing hover:bg-gray-300/50 dark:hover:bg-gray-700/50' : ''
            }`}
          >
            <h3 className="font-semibold text-sm tracking-tight">{column.title}</h3>
            <span className="bg-gray-200 dark:bg-gray-800 text-xs py-0.5 px-2 rounded-full font-medium text-gray-600 dark:text-gray-400">
              {tasks.length}
            </span>
          </div>
    
          <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/5 dark:bg-primary/10' : ''
            }`}
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
            
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground gap-2 h-9 mt-2"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Tarefa
            </Button>
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
