import React, { useState } from 'react';
import { Save, X, Trash2 } from 'lucide-react';
import { KanbanCard } from '../../types/kanban';

interface KanbanCardEditorProps {
  card: KanbanCard;
  onSave: (updates: Partial<KanbanCard>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const KanbanCardEditor: React.FC<KanbanCardEditorProps> = ({
  card,
  onSave,
  onCancel,
  onDelete
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority);
  const [tags, setTags] = useState(card.tags.join(', '));

  const handleSave = () => {
    if (!title.trim()) return;

    const updates: Partial<KanbanCard> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    onSave(updates);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div 
      className="kanban-card-editor"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="kanban-card-editor-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="kanban-card-editor-title"
          placeholder="Título do card"
          autoFocus
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="kanban-card-editor-description"
        placeholder="Descrição (opcional)"
        rows={3}
      />

      <div className="kanban-card-editor-row">
        <div className="kanban-card-editor-field">
          <label htmlFor="priority">Prioridade:</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="kanban-card-editor-select"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      <div className="kanban-card-editor-field">
        <label htmlFor="tags">Tags (separadas por vírgula):</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="kanban-card-editor-input"
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div className="kanban-card-editor-actions">
        <button
          onClick={handleSave}
          className="kanban-card-editor-button kanban-card-editor-button--save"
          disabled={!title.trim()}
          title="Salvar (Ctrl+Enter)"
        >
          <Save size={16} />
          Salvar
        </button>
        
        <button
          onClick={onCancel}
          className="kanban-card-editor-button kanban-card-editor-button--cancel"
          title="Cancelar (Esc)"
        >
          <X size={16} />
          Cancelar
        </button>
        
        <button
          onClick={onDelete}
          className="kanban-card-editor-button kanban-card-editor-button--delete"
          title="Excluir card"
        >
          <Trash2 size={16} />
          Excluir
        </button>
      </div>

      <div className="kanban-card-editor-hint">
        <small>💡 Dica: Ctrl+Enter para salvar, Esc para cancelar</small>
      </div>
    </div>
  );
};

export default KanbanCardEditor;
