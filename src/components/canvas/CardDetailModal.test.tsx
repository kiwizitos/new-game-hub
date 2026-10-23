// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CardDetailModal from './CardDetailModal';

afterEach(cleanup);

describe('expanded canvas card', () => {
  it('shows the full content without executing embedded HTML', () => {
    const { container } = render(<CardDetailModal content={'# Mechanic\n\n<img src=x onerror=alert(1)>\nEnd of a long card'}
      onSave={vi.fn()} onSaveTemplate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Mechanic' })).toBeTruthy();
    expect(screen.getByText(/End of a long card/)).toBeTruthy();
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('dialog').querySelector('img')).toBeNull();
  });

  it('edits and explicitly saves the full content, including an empty card', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CardDetailModal content="Old" onSave={onSave} onSaveTemplate={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar conteúdo' }));
    fireEvent.change(screen.getByLabelText('Conteúdo Markdown'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar card' }));
    expect(onSave).toHaveBeenCalledWith('');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('requires an explicit discard decision on Escape and never saves cancelled changes', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CardDetailModal content="Old" onSave={onSave} onSaveTemplate={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar conteúdo' }));
    fireEvent.change(screen.getByLabelText('Conteúdo Markdown'), { target: { value: 'Unsaved' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }));
    expect(screen.getByLabelText<HTMLTextAreaElement>('Conteúdo Markdown').value).toBe('Unsaved');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a reusable model from the draft and displays validation errors', () => {
    const onSaveTemplate = vi.fn().mockImplementationOnce(() => { throw new Error('Informe um nome'); });
    render(<CardDetailModal content="Content" onSave={vi.fn()} onSaveTemplate={onSaveTemplate} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como modelo' }));
    expect(screen.getByRole('alert').textContent).toContain('Informe um nome');
    fireEvent.change(screen.getByLabelText('Nome do modelo'), { target: { value: 'Mechanic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como modelo' }));
    expect(onSaveTemplate).toHaveBeenLastCalledWith('Mechanic', 'Content');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('traps keyboard focus and restores it to the opener', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { unmount } = render(<CardDetailModal content="Content"
      onSave={vi.fn()} onSaveTemplate={vi.fn()} onClose={vi.fn()} />);
    const first = screen.getByRole('button', { name: 'Fechar modal' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Salvar card' }));
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
