import React, { useState } from 'react';
import { useKanbanStore } from '../../stores/kanbanStore';

const KanbanColumnSettings: React.FC = () => {
  const { data, addColumn, renameColumn, reorderColumn, removeColumn } = useKanbanStore();
  const [newTitle, setNewTitle] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  const perform = (action: () => void) => {
    try {
      action();
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <section className="kanban-column-settings" aria-label="Personalizar colunas">
      <h2>Personalizar colunas</h2>
      <form onSubmit={event => {
        event.preventDefault();
        perform(() => { addColumn(newTitle); setNewTitle(''); });
      }}>
        <label htmlFor="kanban-new-column">Nome da nova coluna</label>
        <input id="kanban-new-column" value={newTitle} onChange={event => setNewTitle(event.target.value)} />
        <button type="submit">Adicionar coluna</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ol>
        {data.columns.map((column, index) => (
          <li key={column.id}>
            <span>{column.title}</span>
            <button type="button" aria-label={`Renomear ${column.title}`} onClick={() => {
              setEditing(column.id); setTitle(column.title); setRemoving(null); setError('');
            }}>Renomear</button>
            <button type="button" aria-label={`Mover ${column.title} para a esquerda`} disabled={index === 0}
              onClick={() => perform(() => reorderColumn(column.id, index - 1))}>←</button>
            <button type="button" aria-label={`Mover ${column.title} para a direita`} disabled={index === data.columns.length - 1}
              onClick={() => perform(() => reorderColumn(column.id, index + 1))}>→</button>
            <button type="button" aria-label={`Remover ${column.title}`} disabled={data.columns.length === 1}
              onClick={() => {
                setRemoving(column.id); setDestination(''); setEditing(null); setError('');
              }}>Remover</button>
            {editing === column.id && (
              <form onSubmit={event => {
                event.preventDefault();
                perform(() => { renameColumn(column.id, title); setEditing(null); });
              }}>
                <label htmlFor="kanban-rename-column">Novo nome da coluna</label>
                <input id="kanban-rename-column" value={title} onChange={event => setTitle(event.target.value)} autoFocus />
                <button type="submit">Salvar nome</button>
                <button type="button" onClick={() => { setEditing(null); setError(''); }}>Cancelar</button>
              </form>
            )}
            {removing === column.id && (
              <div>
                <p>Remover “{column.title}”? {column.cards.length} card(s).
                  {column.cards.length > 0 && ' Todos os cards serão movidos para a coluna escolhida.'}</p>
                {column.cards.length > 0 && <>
                  <label htmlFor="kanban-destination">Coluna de destino</label>
                  <select id="kanban-destination" value={destination} onChange={event => setDestination(event.target.value)}>
                    <option value="">Escolha uma coluna</option>
                    {data.columns.filter(item => item.id !== column.id).map(item =>
                      <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </>}
                <button type="button" onClick={() => perform(() => {
                  removeColumn(column.id, destination || undefined); setRemoving(null);
                })}>Confirmar remoção</button>
                <button type="button" onClick={() => { setRemoving(null); setError(''); }}>Cancelar</button>
              </div>
            )}
          </li>
        ))}
      </ol>
      {data.columns.length === 1 && <p>A última coluna não pode ser removida.</p>}
    </section>
  );
};

export default KanbanColumnSettings;
