import { useEffect, useMemo } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useKanbanStore } from '@/store/kanbanStore';
import confetti from 'canvas-confetti';
import { Column } from '@/components/Board/Column';
import { LayoutDashboard } from 'lucide-react';

export function Dashboard() {
  const {
    columns, tasks, moveTask, fetchData, isLoading,
    boards, currentBoardId,
  } = useKanbanStore();

  useEffect(() => {
    fetchData();
  }, [fetchData, currentBoardId]);

  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => a.order - b.order);
  }, [columns]);

  const currentBoard = useMemo(
    () => boards.find(b => b.id === currentBoardId),
    [boards, currentBoardId]
  );

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Column dragging disabled — only task dragging
    if (type === 'column') return;

    moveTask(draggableId, destination.droppableId, destination.index);

    const destColumn = columns.find(c => c.id === destination.droppableId);
    const isLastColumn = sortedColumns.length > 0 &&
      sortedColumns[sortedColumns.length - 1].id === destination.droppableId;

    if (destColumn && isLastColumn) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#eab308'],
      });
    }
  };

  // No boards assigned to this user
  if (!isLoading && boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gray-50 dark:bg-gray-900">
        <LayoutDashboard className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold text-muted-foreground">Nenhum board vinculado ao usuário</h2>
        <p className="text-sm text-muted-foreground/70 text-center max-w-xs">
          Entre em contato com um administrador para que te adicionem a um board.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Board name bar */}
      {currentBoard && (
        <div className="px-6 pt-4 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">{currentBoard.name}</h2>
            {currentBoard.description && (
              <span className="text-sm text-muted-foreground">— {currentBoard.description}</span>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div
                className="flex gap-6 h-full items-start"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sortedColumns.map((col, index) => {
                  const columnTasks = tasks
                    .filter(t => t.status === col.id)
                    .sort((a, b) => a.order - b.order);
                  return (
                    <Column
                      key={col.id}
                      column={col}
                      tasks={columnTasks}
                      index={index}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
    </div>
  );
}
