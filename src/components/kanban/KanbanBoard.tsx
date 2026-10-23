import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { MoreVertical } from 'lucide-react';
import { useKanbanStore } from '../../stores/kanbanStore';
import { useAppStore } from '../../stores/appStore';
import { usePopup } from '../../contexts/PopupContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useContextMenu } from '../../hooks/useContextMenu';
import { KanbanCard } from '../../types/kanban';
import KanbanColumn from './KanbanColumn.tsx';
import KanbanDataManager from './KanbanDataManager.tsx';
import KanbanColumnSettings from './KanbanColumnSettings';
import ContextMenu from '../common/ContextMenu';
import ViewPlaceholder from '../common/ViewPlaceholder';
import FileService from '../../services/FileService';
import './KanbanBoard.css';

const KanbanBoard: React.FC = () => {
  const { selectedFile } = useAppStore();
  if (!selectedFile?.endsWith('.kanban')) {
    return <ViewPlaceholder type="kanban" title="Quadro Kanban"
      description="Organize suas tarefas e projetos usando o método Kanban com colunas personalizáveis."
      currentFile={null} expectedFileType=".kanban" />;
  }
  return <KanbanFile key={selectedFile} path={selectedFile} />;
};

const KanbanFile: React.FC<{ path: string }> = ({ path }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const fileService = FileService.getInstance();
  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const loaded = await fileService.loadKanbanFile(path);
        if (disposed) return;
        useKanbanStore.getState().setKanbanData(loaded);
        setStatus('ready');
      } catch (cause) {
        if (disposed) return;
        setError(String(cause));
        setStatus('error');
      }
    };
    void load();
    return () => { disposed = true; };
  }, [path, fileService]);

  if (status === 'loading') return <div role="status" className="kanban-loading">Carregando arquivo...</div>;
  if (status === 'error') return <div role="alert" className="kanban-load-error">
    Não foi possível abrir {path}. O arquivo não foi alterado. {error}
  </div>;
  return <LoadedKanbanBoard currentFile={path} />;
};

const LoadedKanbanBoard: React.FC<{ currentFile: string }> = ({ currentFile }) => {
  const { data, addCard, moveCard, deleteCard, updateCard } = useKanbanStore();
  const { showConfirm } = usePopup();
  const [showColumns, setShowColumns] = useState(false);
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const fileService = FileService.getInstance();
  const lastSaved = useRef(JSON.stringify(data));
  const save = useCallback(async () => {
    const snapshot = JSON.stringify(data);
    if (snapshot === lastSaved.current) return;
    await fileService.createKanbanFile(currentFile, data);
    lastSaved.current = snapshot;
  }, [currentFile, data, fileService]);
  const { isSaving, forceSave } = useAutoSave(data, { onSave: save, saveOnUnmount: true });

  const handleAddCard = useCallback((columnId: string, title: string, description?: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    addCard(columnId, {
      title,
      description,
      priority,
      tags: []
    });
  }, [addCard]);

  const handleMoveCard = useCallback((cardId: string, targetColumnId: string) => {
    moveCard(cardId, targetColumnId);
  }, [moveCard]);

  const handleDeleteCard = useCallback((cardId: string) => {
    showConfirm(
      'Excluir Tarefa',
      'Tem certeza que deseja excluir esta tarefa?',
      () => {
        deleteCard(cardId);
      }
    );
  }, [deleteCard, showConfirm]);

  const handleUpdateCard = useCallback((cardId: string, updates: Partial<KanbanCard>) => {
    updateCard(cardId, updates);
  }, [updateCard]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const cardId = active.id as string;
    const targetColumnId = over.id as string;

    // Se o card foi solto sobre uma coluna diferente da atual, mova-o
    if (active.data.current?.columnId !== targetColumnId) {
      handleMoveCard(cardId, targetColumnId);
    }
  }, [handleMoveCard]);

  const handleOptionsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    showContextMenu(event, [
      {
        id: 'export',
        label: 'Exportar JSON',
        icon: '📤',
        action: () => {
          // Trigger export from KanbanDataManager
          const manager = document.querySelector('.kanban-data-manager') as HTMLElement;
          const exportBtn = manager?.querySelector('[title*="Exportar"]') as HTMLButtonElement;
          exportBtn?.click();
        }
      },
      {
        id: 'import-file',
        label: 'Importar Arquivo',
        icon: '📁',
        action: () => {
          // Trigger file import from KanbanDataManager
          const manager = document.querySelector('.kanban-data-manager') as HTMLElement;
          const importInput = manager?.querySelector('input[type="file"]') as HTMLInputElement;
          importInput?.click();
        }
      },
      {
        id: 'import-json',
        label: 'Importar JSON',
        icon: '📋',
        action: () => {
          // Trigger JSON import from KanbanDataManager
          const manager = document.querySelector('.kanban-data-manager') as HTMLElement;
          const importBtn = manager?.querySelector('[title*="Importar dados"]') as HTMLButtonElement;
          importBtn?.click();
        }
      },
      {
        id: 'save',
        label: 'Salvar',
        icon: '💾',
        action: () => {
          // Trigger save from KanbanDataManager
          const manager = document.querySelector('.kanban-data-manager') as HTMLElement;
          const saveBtn = manager?.querySelector('[title*="Salvar"]') as HTMLButtonElement;
          saveBtn?.click();
        }
      }
    ]);
  };

  return (
    <DndContext 
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board" onContextMenu={(e) => e.preventDefault()}>
        <div className="kanban-board-header">
          <div className="kanban-title">
            {currentFile ? (
              <>
                <span className="file-name">
                  {fileService.getFileNameWithoutExtension(currentFile)}
                  {isSaving && <span className="save-indicator"> •</span>}
                </span>
                <span className="file-path">{currentFile}</span>
              </>
            ) : (
              <span className="no-file">Kanban Board</span>
            )}
          </div>
          
          <div className="kanban-actions">
            <button type="button" onClick={() => setShowColumns(value => !value)} aria-expanded={showColumns}>
              Personalizar colunas
            </button>
            <button
              className="options-button"
              onClick={handleOptionsClick}
              title="Opções"
              aria-label="Opções do quadro"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        
        {/* Hidden KanbanDataManager for programmatic access */}
        <div style={{ display: 'none' }}>
          <KanbanDataManager onSave={forceSave} />
        </div>
        
        {showColumns && <KanbanColumnSettings />}
        {
          <div className="kanban-columns">
            {data.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
              />
            ))}
          </div>
        }
      </div>

      {contextMenu.visible && (
        <ContextMenu
          position={contextMenu.position}
          items={contextMenu.items}
          onClose={hideContextMenu}
          visible={contextMenu.visible}
        />
      )}
    </DndContext>
  );
};

export default KanbanBoard;
