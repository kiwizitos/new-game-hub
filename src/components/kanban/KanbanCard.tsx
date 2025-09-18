import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Trash2, Edit3 } from 'lucide-react';
import { KanbanCard } from '../../types/kanban';
import KanbanCardEditor from './KanbanCardEditor';

interface KanbanCardProps {
  card: KanbanCard;
  columnId: string;
  onDelete: (cardId: string) => void;
  onUpdate: (cardId: string, updates: Partial<KanbanCard>) => void;
}

const KanbanCardComponent: React.FC<KanbanCardProps> = ({
  card,
  columnId,
  onDelete,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    data: {
      columnId,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (updates: Partial<KanbanCard>) => {
    onUpdate(card.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(card.id);
    setIsEditing(false);
  };

  // Se estiver em modo de edição, mostrar o editor
  if (isEditing) {
    return (
      <KanbanCardEditor
        card={card}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''}`}
      {...attributes}
    >
      <div className="kanban-card-header">
        <h4 
          className="kanban-card-title"
          {...listeners}
          style={{ cursor: 'grab' }}
        >
          {card.title}
        </h4>
        <div className="kanban-card-actions">
          <button
            className="kanban-card-edit"
            onClick={handleEdit}
            title="Editar card"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="kanban-card-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            title="Excluir card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {card.description && (
        <p className="kanban-card-description">
          {card.description}
        </p>
      )}

      <div className="kanban-card-footer">
        <span 
          className="kanban-card-priority" 
          data-priority={card.priority}
          style={{ backgroundColor: getPriorityColor(card.priority) }}
        >
          {getPriorityLabel(card.priority)}
        </span>
        
        {card.tags && card.tags.length > 0 && (
          <div className="kanban-card-tags">
            {card.tags.map((tag, index) => (
              <span key={index} className="kanban-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCardComponent;
