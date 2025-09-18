import React, { useCallback, useEffect, useState } from 'react';
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
import ContextMenu from '../common/ContextMenu';
import ViewPlaceholder from '../common/ViewPlaceholder';
import FileService from '../../services/FileService';
import './KanbanBoard.css';

const KanbanBoard: React.FC = () => {
  const { data, addCard, moveCard, deleteCard, updateCard, setKanbanData } = useKanbanStore();
  const { selectedFile } = useAppStore();
  const { showConfirm } = usePopup();
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const fileService = FileService.getInstance();

  // Auto-save hook
  const { isSaving } = useAutoSave(data, {
    onSave: async () => {
      if (!currentFile) return;
      await fileService.createKanbanFile(currentFile, data);
    },
    enabled: !!currentFile,
  });

  // Load file when selectedFile changes
  useEffect(() => {
    const loadFile = async () => {
      if (!selectedFile || !selectedFile.endsWith('.kanban')) {
        // If no kanban file is selected, keep current file or show placeholder
        // Don't clear currentFile if we already have one loaded
        if (!currentFile) {
          const { loadKanbanData } = useKanbanStore.getState();
          loadKanbanData();
        }
        return;
      }
      
      setIsLoading(true);
      try {
        const kanbanData = await fileService.loadKanbanFile(selectedFile);
        setKanbanData(kanbanData);
        setCurrentFile(selectedFile);
      } catch (error) {
        console.error('Error loading kanban file:', error);
        
        // Verificar se o erro é de arquivo não encontrado
        const errorMessage = String(error);
        if (errorMessage.includes('não pode encontrar o arquivo') || 
            errorMessage.includes('No such file') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('os error 2')) {
          // Arquivo foi deletado - limpar seleção para voltar ao placeholder
          const { setSelectedFile } = useAppStore.getState();
          setSelectedFile(null);
          setCurrentFile(null);
        } else {
          // Outro tipo de erro - criar estrutura padrão
          const defaultData = { columns: [
            { id: 'todo', title: 'To Do', cards: [], color: '#ef4444' },
            { id: 'in-progress', title: 'In Progress', cards: [], color: '#f59e0b' },
            { id: 'done', title: 'Done', cards: [], color: '#10b981' }
          ]};
          setKanbanData(defaultData);
          setCurrentFile(selectedFile);
          
          // Save the default structure to the file
          try {
            await fileService.createKanbanFile(selectedFile, defaultData);
          } catch (saveError) {
            console.error('Error creating default kanban file:', saveError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [selectedFile, setKanbanData, fileService]);

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

  // Verificar se deve mostrar placeholder
  const shouldShowPlaceholder = !currentFile;

  if (shouldShowPlaceholder) {
    return (
      <ViewPlaceholder
        type="kanban"
        title="Quadro Kanban"
        description="Organize suas tarefas e projetos usando o método Kanban com colunas personalizáveis."
        currentFile={null}
        expectedFileType=".kanban"
      />
    );
  }

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
            <button
              className="options-button"
              onClick={handleOptionsClick}
              title="Opções"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        
        {/* Hidden KanbanDataManager for programmatic access */}
        <div style={{ display: 'none' }}>
          <KanbanDataManager />
        </div>
        
        {isLoading ? (
          <div className="kanban-loading">
            <div>⏳ Carregando arquivo...</div>
          </div>
        ) : (
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
        )}
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
