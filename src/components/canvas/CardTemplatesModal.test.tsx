// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CardTemplatesModal from './CardTemplatesModal';

afterEach(cleanup);
const model = { id: 'model', name: 'Mechanic', content: 'Rules', width: 240, height: 160 };

describe('canvas model library', () => {
  it('creates a model with content and dimensions', () => {
    const onSave = vi.fn();
    render(<CardTemplatesModal templates={[]} onSave={onSave} onDelete={vi.fn()}
      onCreateCard={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Novo modelo' }));
    fireEvent.change(screen.getByLabelText('Nome do modelo'), { target: { value: 'Enemy' } });
    fireEvent.change(screen.getByLabelText('Conteúdo do modelo'), { target: { value: '# Enemy\nHealth:' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar modelo' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Enemy', content: '# Enemy\nHealth:', width: 240, height: 160,
    }));
  });

  it('copies a model into a card without modifying the model', () => {
    const onCreateCard = vi.fn();
    const onClose = vi.fn();
    render(<CardTemplatesModal templates={[model]} onSave={vi.fn()} onDelete={vi.fn()}
      onCreateCard={onCreateCard} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar card: Mechanic' }));
    expect(onCreateCard).toHaveBeenCalledWith(model);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('edits existing models and requires confirmation before removal', () => {
    const onSave = vi.fn();
    const onDelete = vi.fn();
    render(<CardTemplatesModal templates={[model]} onSave={onSave} onDelete={onDelete}
      onCreateCard={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar modelo: Mechanic' }));
    fireEvent.change(screen.getByLabelText('Nome do modelo'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar modelo' }));
    expect(onSave).toHaveBeenCalledWith({ ...model, name: 'Updated' });
    expect(model.name).toBe('Mechanic');
    fireEvent.click(screen.getByRole('button', { name: 'Remover modelo: Mechanic' }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(onDelete).toHaveBeenCalledWith('model');
  });
});
