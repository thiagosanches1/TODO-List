import { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Column as ColumnType, Task as TaskType } from '@/store/kanbanStore';
import { useKanbanStore } from '@/store/kanbanStore';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Check, X } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: TaskType[];
  index: number;
  isEditMode: boolean;
}

export function Column({ column, tasks, index, isEditMode }: ColumnProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { renameColumn } = useKanbanStore();

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftTitle(column.title);
    setIsRenaming(true);
  };

  const confirmRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== column.title) {
      renameColumn(column.id, trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setDraftTitle(column.title);
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') cancelRename();
  };

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
            {/* Column title — inline editable in edit mode */}
            {isRenaming ? (
              <div className="flex items-center gap-1 flex-1 mr-2">
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-sm font-semibold bg-white dark:bg-gray-900 border border-primary rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={confirmRename}
                  className="text-green-600 hover:text-green-700 p-0.5 rounded"
                  title="Confirmar"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={cancelRename}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                  title="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="font-semibold text-sm tracking-tight truncate">{column.title}</h3>
                {isEditMode && (
                  <button
                    onClick={startRename}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    title="Renomear coluna"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {!isRenaming && (
              <span className="bg-gray-200 dark:bg-gray-800 text-xs py-0.5 px-2 rounded-full font-medium text-gray-600 dark:text-gray-400 shrink-0">
                {tasks.length}
              </span>
            )}
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

                {index === 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground gap-2 h-9 mt-2"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Tarefa
                  </Button>
                )}
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
