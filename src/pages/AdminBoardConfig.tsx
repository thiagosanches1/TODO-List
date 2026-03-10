import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Columns, Plus, Trash2, Loader2, Edit2,
  GripVertical, Save, RotateCcw,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface BoardColumn {
  id: string;
  title: string;
  order_index: number;
  board_id: string;
  isNew?: boolean; // Flag for newly created columns not yet in DB
}

interface Board {
  id: string;
  name: string;
  description: string;
}

export function AdminBoardConfig() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [initialColumns, setInitialColumns] = useState<BoardColumn[]>([]);
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create column state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [boardId]);

  const fetchData = async () => {
    if (!boardId) return;
    setLoading(true);

    const [boardRes, colsRes] = await Promise.all([
      supabase.from('boards').select('*').eq('id', boardId).single(),
      supabase.from('columns').select('*').eq('board_id', boardId).order('order_index', { ascending: true }),
    ]);

    if (boardRes.data) setBoard(boardRes.data);
    else { navigate('/admin/boards'); return; }

    if (colsRes.data) {
      setInitialColumns(colsRes.data);
      setLocalColumns(colsRes.data);
    }
    setDeletedIds([]);
    setLoading(false);
  };

  const isDirty = useMemo(() => {
    if (deletedIds.length > 0) return true;
    if (localColumns.length !== initialColumns.length) return true;

    // Check for any changes in existing columns
    return localColumns.some((col, idx) => {
      const original = initialColumns.find(ic => ic.id === col.id);
      if (!original) return true; // It's new
      return original.title !== col.title || original.order_index !== idx;
    });
  }, [localColumns, initialColumns, deletedIds]);

  const handleAddLocalColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !boardId) return;

    const newCol: BoardColumn = {
      id: crypto.randomUUID(),
      title: newColumnTitle.trim(),
      board_id: boardId,
      order_index: localColumns.length,
      isNew: true,
    };

    setLocalColumns([...localColumns, newCol]);
    setNewColumnTitle('');
    setIsCreateOpen(false);
  };

  const handleDeleteLocalColumn = (col: BoardColumn) => {
    if (!confirm(`Excluir a coluna "${col.title}"? Todas as tasks nela serão perdidas.`)) return;

    setLocalColumns(localColumns.filter(c => c.id !== col.id));
    if (!col.isNew) {
      setDeletedIds([...deletedIds, col.id]);
    }
  };

  const handleRenameLocalColumn = (id: string) => {
    if (!renameTitle.trim()) {
      setRenamingId(null);
      return;
    }
    setLocalColumns(localColumns.map(c => c.id === id ? { ...c, title: renameTitle.trim() } : c));
    setRenamingId(null);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;

    const newCols = [...localColumns];
    const [removed] = newCols.splice(source.index, 1);
    newCols.splice(destination.index, 0, removed);

    // Re-index
    const reindexed = newCols.map((col, idx) => ({ ...col, order_index: idx }));
    setLocalColumns(reindexed);
  };

  const handleSaveAll = async () => {
    if (!isDirty || !boardId) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Delete columns
      if (deletedIds.length > 0) {
        // Delete tasks first due to potential FK constraints (though CASCADE is likely, it's safer)
        await supabase.from('tasks').delete().in('status', deletedIds);
        const { error: delError } = await supabase.from('columns').delete().in('id', deletedIds);
        if (delError) throw delError;
      }

      // 2. Separate new and existing columns
      const newCols = localColumns.filter(c => c.isNew).map(({ isNew, ...rest }, idx) => ({
        ...rest,
        id: rest.id, // Keep the generated UUID
        title: rest.title,
        order_index: idx,
        board_id: boardId
      }));

      const existingCols = localColumns.filter(c => !c.isNew).map((col, idx) => ({
        id: col.id,
        title: col.title,
        order_index: idx,
        board_id: col.board_id,
      }));

      // 3. Upsert existing columns (updates title and order)
      if (existingCols.length > 0) {
        const { error: upError } = await supabase.from('columns').upsert(existingCols);
        if (upError) throw upError;
      }

      // 4. Insert new columns
      if (newCols.length > 0) {
        const { error: insError } = await supabase.from('columns').insert(newCols);
        if (insError) throw insError;
      }

      setSuccess('Alterações salvas com sucesso!');
      fetchData(); // Refresh everything
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alterações');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('Descartar todas as alterações não salvas?')) {
      setLocalColumns(initialColumns);
      setDeletedIds([]);
      setSuccess(null);
      setError(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            <button onClick={() => navigate('/admin/boards')} className="hover:underline">Boards</button>
            {' / '}
            <span className="text-foreground font-medium">{board?.name ?? '...'}</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Configurar Colunas</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md shrink-0">
          <Plus className="h-4 w-4" />
          Nova Coluna
        </Button>
      </div>

      {/* Status Icons */}
      {(success || error) && (
        <div className="space-y-4">
          {success && (
            <div className="p-3 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Main Column Listing */}
      <Card className="shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Columns className="h-5 w-5 text-primary" />
              Organizador de Colunas
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {localColumns.length} coluna{localColumns.length !== 1 ? 's' : ''}
              {isDirty && <span className="ml-2 text-amber-500 font-medium">(Alterações não salvas)</span>}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : localColumns.length === 0 ? (
            <div className="p-12 text-center">
              <Columns className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-sm">Nenhuma coluna disponível.</p>
              <p className="text-muted-foreground/70 text-xs mt-1">Crie a primeira coluna para este board.</p>
            </div>
          ) : (
            <div className="w-full text-sm">
              {/* Header */}
              <div className="grid grid-cols-[48px_48px_1fr_180px] w-full text-xs uppercase bg-muted/50 text-muted-foreground font-extrabold border-b px-6 py-4">
                <div className="flex justify-center text-primary/50">#</div>
                <div className="text-center invisible">#</div>
                <div>Nome da Coluna</div>
                <div className="text-right px-4">Ações</div>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="columns-admin">
                  {(provided, dropSnapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={(el) => {
                        provided.innerRef(el);
                        (containerRef as any).current = el;
                      }}
                      className={`divide-y divide-muted w-full transition-colors relative ${dropSnapshot.isDraggingOver ? 'bg-muted/5' : ''}`}
                    >
                      {localColumns.map((col, idx) => (
                        <Draggable key={col.id} draggableId={col.id} index={idx}>
                          {(provided, snapshot) => {
                            const draggingStyle = provided.draggableProps.style as any;
                            const containerWidth = containerRef.current?.clientWidth;

                            const content = (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...draggingStyle,
                                  width: snapshot.isDragging && containerWidth ? `${containerWidth}px` : (draggingStyle?.width || '100%'),
                                  position: snapshot.isDragging ? 'fixed' : draggingStyle?.position,
                                  zIndex: snapshot.isDragging ? 1000 : draggingStyle?.zIndex,
                                }}
                                className={`${snapshot.isDragging ? 'pointer-events-none' : ''}`}
                              >
                                <div className={`grid grid-cols-[48px_48px_1fr_180px] w-full items-center transition-all px-6 py-4 ${snapshot.isDragging
                                  ? 'bg-background border-2 border-primary shadow-2xl rounded-2xl ring-4 ring-primary/20 scale-[1.01]'
                                  : 'hover:bg-muted/30'
                                  }`}>
                                  <div className="flex justify-center">
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-all hover:text-primary pointer-events-auto">
                                      <GripVertical className="h-4.5 w-4.5" />
                                    </div>
                                  </div>
                                  <div className="text-center text-muted-foreground font-mono text-xs font-black">{idx + 1}</div>
                                  <div className="font-bold px-2 truncate min-w-0">
                                    {renamingId === col.id ? (
                                      <div className="flex items-center gap-2 pointer-events-auto">
                                        <Input
                                          value={renameTitle}
                                          onChange={(e) => setRenameTitle(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameLocalColumn(col.id);
                                            if (e.key === 'Escape') setRenamingId(null);
                                          }}
                                          className="h-9 text-sm w-full max-w-[240px] bg-background/50 border-primary/30 font-bold"
                                          autoFocus
                                        />
                                        <Button
                                          size="sm"
                                          className="h-9 py-0 px-4 bg-green-600 hover:bg-green-700 shadow-md font-bold"
                                          onClick={() => handleRenameLocalColumn(col.id)}
                                        >
                                          Salvar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-9 py-0 px-4 font-bold"
                                          onClick={() => setRenamingId(null)}
                                        >
                                          Sair
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="flex items-center gap-2 group/title">
                                        <span className="group-hover/title:text-primary transition-colors truncate">{col.title}</span>
                                        {col.isNew && <span className="text-[9px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex-shrink-0 animate-pulse">Nova</span>}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-end gap-2 px-2 pointer-events-auto">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setRenamingId(col.id);
                                        setRenameTitle(col.title);
                                      }}
                                      className="h-9 w-9 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                                      title="Renomear"
                                    >
                                      <Edit2 className="h-4.5 w-4.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteLocalColumn(col)}
                                      className="h-9 w-9 text-destructive hover:text-white hover:bg-destructive shadow-sm hover:shadow-destructive/40 rounded-xl transition-all"
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4.5 w-4.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );

                            if (snapshot.isDragging) {
                              return ReactDOM.createPortal(content, document.body);
                            }
                            return content;
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Save Bar for better visibility on mobile/long lists */}
      {isDirty && !loading && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 p-4 bg-background border shadow-2xl rounded-full scale-110 md:scale-125 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Button
            variant="ghost"
            onClick={handleDiscard}
            className="rounded-full text-muted-foreground hover:text-destructive gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Cancelar
          </Button>
          <div className="w-[1px] bg-muted h-6 self-center" />
          <Button
            onClick={handleSaveAll}
            disabled={isSubmitting}
            className="rounded-full bg-green-600 hover:bg-green-700 gap-2 font-bold px-6"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      )}

      {/* Create Column Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Adicionar Coluna
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLocalColumn} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="colTitle">Nome da Coluna</Label>
              <Input
                id="colTitle"
                placeholder="Ex: Em Progresso"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Pronto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
