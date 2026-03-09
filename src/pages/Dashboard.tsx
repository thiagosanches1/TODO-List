import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useKanbanStore } from '@/store/kanbanStore';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/Board/Column';
import { CreateColumnModal } from '@/components/Board/CreateColumnModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut } from 'lucide-react';

export function Dashboard() {
  const { columns, tasks, moveTask, reorderColumn, fetchData, isLoading } = useKanbanStore();
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isAdmin = userEmail === 'thiago@admin.com';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });
    fetchData();
  }, [fetchData]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'column') {
      if (isEditMode) {
         reorderColumn(source.index, destination.index);
      }
      return;
    }

    moveTask(draggableId, destination.droppableId, destination.index);

    // Confetti effect if moving to the "Concluído" (or a column named similarly)
    const destColumn = columns.find(c => c.id === destination.droppableId);
    if (destColumn && destColumn.title.toLowerCase().includes('conclu')) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#eab308']
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b bg-white dark:bg-gray-950 px-6 shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground p-1 rounded">✓</span>
          TODO Kanban
        </h1>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button 
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="mr-2"
            >
              {isEditMode ? 'Salvar Configurações' : 'Editar Colunas'}
            </Button>
          )}
          
          {userEmail && (
            <span className="text-sm text-muted-foreground mr-2 hidden sm:inline-block">
              {userEmail}
            </span>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div 
                className="flex gap-6 h-full items-start"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {columns.sort((a,b) => a.order - b.order).map((col, index) => {
                  const columnTasks = tasks.filter(t => t.status === col.id).sort((a,b) => a.order - b.order);
                  return <Column key={col.id} column={col} tasks={columnTasks} index={index} isEditMode={isEditMode} />;
                })}
                {provided.placeholder}
                
                {isEditMode && (
                  <div className="min-w-[300px] shrink-0">
                     <Button
                       variant="outline"
                       className="w-full justify-start text-muted-foreground border-dashed h-12 hover:bg-primary/5 hover:text-primary hover:border-primary"
                       onClick={() => setIsColumnModalOpen(true)}
                     >
                       + Adicionar Coluna
                     </Button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>

      <CreateColumnModal
        open={isColumnModalOpen}
        onOpenChange={setIsColumnModalOpen}
      />
    </div>
  );
}
