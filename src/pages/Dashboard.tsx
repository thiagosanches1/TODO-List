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

    // Trigger confetti if it's the last column (highest order) OR has "conclu" in the title
    const isLastColumn = sortedColumns.length > 0 &&
      sortedColumns[sortedColumns.length - 1].id === destination.droppableId;
    const hasConcluTitle = destColumn?.title.toLowerCase().includes('conclu');

    if (destColumn && (isLastColumn || hasConcluTitle)) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#eab308', '#ec4899'],
        });
      }, 100);
    }
  };

  // No boards assigned to this user
  if (!isLoading && boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 bg-background">
        <div className="p-6 rounded-full bg-muted/50 border border-border/50 animate-in fade-in zoom-in duration-500">
          <LayoutDashboard className="h-16 w-16 text-muted-foreground/40" />
        </div>
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <h2 className="text-2xl font-bold tracking-tight">Nenhum board encontrado</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Parece que você ainda não foi convidado para nenhum board. Solicite acesso a um administrador.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Board header bar */}
      {currentBoard && (
        <div className="px-8 py-5 shrink-0 border-b bg-muted/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight leading-none mb-1">{currentBoard.name}</h2>
              {currentBoard.description && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentBoard.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto px-8 py-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div
                className="flex gap-8 h-full items-start"
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
