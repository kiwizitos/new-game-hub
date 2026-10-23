import { useState } from 'react';
import Modal from '../common/Modal';
import CardContent from './CardContent';

interface CardDetailModalProps {
  content: string;
  onSave: (content: string) => void;
  onSaveTemplate: (name: string, content: string) => void;
  onClose: () => void;
}

export default function CardDetailModal({ content, onSave, onSaveTemplate, onClose }: CardDetailModalProps) {
  const [draft, setDraft] = useState(content);
  const [editing, setEditing] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [discarding, setDiscarding] = useState(false);
  const requestClose = () => draft !== content ? setDiscarding(true) : onClose();
  return (
    <Modal title="Conteúdo do card" onClose={requestClose}>
      <button type="button" onClick={() => setEditing(value => !value)}>
        {editing ? 'Visualizar conteúdo' : 'Editar conteúdo'}
      </button>
      {editing ? (
        <label>Conteúdo Markdown
          <textarea value={draft} onChange={event => setDraft(event.target.value)} />
        </label>
      ) : (
        <CardContent content={draft} className="canvas-card-full-content" />
      )}
      <label>Nome do modelo
        <input value={templateName} onChange={event => setTemplateName(event.target.value)} />
      </label>
      <button type="button" onClick={() => {
        try {
          onSaveTemplate(templateName, draft);
          setTemplateName('');
          setError('');
          setStatus('Modelo salvo neste canvas.');
        } catch (error) {
          setError(error instanceof Error ? error.message : String(error));
        }
      }}>Salvar como modelo</button>
      {error && <p role="alert" className="detail-modal-error">{error}</p>}
      {status && <p role="status">{status}</p>}
      {discarding ? (
        <div role="group" aria-label="Alterações não salvas">
          <p>Descartar as alterações não salvas do card?</p>
          <button type="button" onClick={onClose}>Descartar alterações</button>
          <button type="button" onClick={() => setDiscarding(false)}>Continuar editando</button>
        </div>
      ) : (
        <div className="detail-modal-actions">
          <button type="button" onClick={requestClose}>Cancelar</button>
          <button type="button" onClick={() => { onSave(draft); onClose(); }}>Salvar card</button>
        </div>
      )}
    </Modal>
  );
}
