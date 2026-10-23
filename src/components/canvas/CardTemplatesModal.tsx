import { useState } from 'react';
import type { CanvasCardTemplate } from '../../types/canvas';
import Modal from '../common/Modal';

interface CardTemplatesModalProps {
  templates: CanvasCardTemplate[];
  onSave: (template: CanvasCardTemplate) => void;
  onDelete: (id: string) => void;
  onCreateCard: (template: CanvasCardTemplate) => void;
  onClose: () => void;
}

export default function CardTemplatesModal({
  templates, onSave, onDelete, onCreateCard, onClose,
}: CardTemplatesModalProps) {
  const [draft, setDraft] = useState<CanvasCardTemplate | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const requestClose = () => draft ? setDiscarding(true) : onClose();
  return (
    <Modal title="Modelos de cards deste canvas" onClose={requestClose}>
      <p>Modelos acompanham este arquivo. Alterar ou remover um modelo não altera os cards já criados.</p>
      {draft ? (
        <form onSubmit={event => {
          event.preventDefault();
          try {
            onSave(draft);
            setDraft(null);
            setError('');
          } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
          }
        }}>
          <label>Nome do modelo
            <input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>Conteúdo do modelo
            <textarea value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} />
          </label>
          <label>Largura
            <input type="number" min={140} required value={draft.width}
              onChange={event => setDraft({ ...draft, width: event.target.valueAsNumber })} />
          </label>
          <label>Altura
            <input type="number" min={80} required value={draft.height}
              onChange={event => setDraft({ ...draft, height: event.target.valueAsNumber })} />
          </label>
          {error && <p role="alert" className="detail-modal-error">{error}</p>}
          <div className="detail-modal-actions">
            <button type="button" onClick={() => { setDraft(null); setError(''); }}>Cancelar edição do modelo</button>
            <button type="submit">Salvar modelo</button>
          </div>
        </form>
      ) : (
        <>
          <button type="button" onClick={() => setDraft({
            id: crypto.randomUUID(), name: '', content: '# Mecânica\n\nObjetivo:\nRegras:\nFeedback:\nCritérios de teste:',
            width: 240, height: 160,
          })}>Novo modelo</button>
          {!templates.length && <p>Nenhum modelo salvo. Crie um modelo ou salve um card como modelo.</p>}
          <ul className="canvas-template-list">
            {templates.map(template => (
              <li key={template.id}>
                <h3>{template.name}</h3>
                <div className="detail-modal-actions">
                  <button type="button" onClick={() => { onCreateCard(template); onClose(); }}
                    aria-label={`Criar card: ${template.name}`}>Criar card</button>
                  <button type="button" onClick={() => { setDraft({ ...template }); setError(''); }}
                    aria-label={`Editar modelo: ${template.name}`}>Editar</button>
                  <button type="button" onClick={() => setDeleting(template.id)}
                    aria-label={`Remover modelo: ${template.name}`}>Remover</button>
                </div>
                {deleting === template.id && <div role="group" aria-label="Confirmar remoção do modelo">
                  <p>Remover este modelo? Os cards existentes serão mantidos.</p>
                  <button type="button" onClick={() => { onDelete(template.id); setDeleting(null); }}>Confirmar remoção</button>
                  <button type="button" onClick={() => setDeleting(null)}>Manter modelo</button>
                </div>}
              </li>
            ))}
          </ul>
        </>
      )}
      {discarding && <div role="group" aria-label="Alterações não salvas">
        <p>Descartar a edição do modelo?</p>
        <button type="button" onClick={onClose}>Descartar edição e fechar</button>
        <button type="button" onClick={() => setDiscarding(false)}>Continuar editando</button>
      </div>}
    </Modal>
  );
}
