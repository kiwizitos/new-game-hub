import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, X } from 'lucide-react';
import { KanbanColumn as KanbanColumnType, KanbanCard } from '../../types/kanban';
import KanbanCardComponent from './KanbanCard.tsx';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onAddCard: (columnId: string, title: string, description?: string, priority?: 'low' | 'medium' | 'high') => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onAddCard,
  onDeleteCard,
  onUpdateCard
}) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;

    onAddCard(column.id, newCardTitle, newCardDescription || undefined, newCardPriority);

    // Limpar formulário
    setNewCardTitle('');
    setNewCardDescription('');
    setNewCardPriority('medium');
    setShowAddCard(false);
  };

  const handleCancelAdd = () => {
    setNewCardTitle('');
    setNewCardDescription('');
    setNewCardPriority('medium');
    setShowAddCard(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title" style={{ color: column.color }}>
          {column.title}
        </div>
        <span className="kanban-column-count">
          {column.cards.length}
        </span>
      </div>

      <div className="kanban-column-content">
        {column.cards.map((card) => (
          <KanbanCardComponent
            key={card.id}
            card={card}
            columnId={column.id}
            onDelete={onDeleteCard}
            onUpdate={onUpdateCard}
          />
        ))}

        {showAddCard ? (
          <div className="kanban-add-card-form">
            <input
              type="text"
              placeholder="Título do card"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className="kanban-add-card-input"
              autoFocus
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              className="kanban-add-card-textarea"
              rows={2}
            />
            <div className="kanban-add-card-priority">
              <label htmlFor="priority">Prioridade:</label>
              <select
                id="priority"
                value={newCardPriority}
                onChange={(e) => setNewCardPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="kanban-add-card-select"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="kanban-add-card-buttons">
              <button onClick={handleAddCard} className="kanban-add-card-save">
                Adicionar
              </button>
              <button onClick={handleCancelAdd} className="kanban-add-card-cancel">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="kanban-add-card-button"
          >
            <Plus size={16} />
            Adicionar card
          </button>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
