// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TemplateModal from './TemplateModal';

afterEach(cleanup);

describe('template selection', () => {
  it('creates a game document with a trimmed name and supports searching by tags', () => {
    const onSelectTemplate = vi.fn();
    const onClose = vi.fn();
    render(<TemplateModal isOpen onClose={onClose} onSelectTemplate={onSelectTemplate} />);
    fireEvent.change(screen.getByPlaceholderText('Search templates...'), { target: { value: 'gdd' } });
    fireEvent.click(screen.getByRole('button', { name: /Game Design Document/ }));
    fireEvent.change(screen.getByLabelText('File Name:'), { target: { value: '  My Game  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create File' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'md-game-design', type: 'markdown' }), 'My Game',
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clears selection when changing type so the displayed extension matches the created file', () => {
    const onSelectTemplate = vi.fn();
    render(<TemplateModal isOpen onClose={vi.fn()} onSelectTemplate={onSelectTemplate} />);
    fireEvent.click(screen.getByRole('button', { name: /Game Design Document/ }));
    fireEvent.change(screen.getByLabelText('File Name:'), { target: { value: 'production' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kanban' }));
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Create File' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Game Production Board/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create File' }));
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'kanban-game-production', type: 'kanban' }), 'production',
    );
  });

  it('honors the requested module and resets stale fields each time it opens', () => {
    const props = { onClose: vi.fn(), onSelectTemplate: vi.fn() };
    const { rerender } = render(<TemplateModal {...props} isOpen defaultType="markdown" />);
    fireEvent.click(screen.getByRole('button', { name: /Game Design Document/ }));
    fireEvent.change(screen.getByLabelText('File Name:'), { target: { value: 'old-document' } });
    fireEvent.change(screen.getByPlaceholderText('Search templates...'), { target: { value: 'gdd' } });
    rerender(<TemplateModal {...props} isOpen={false} defaultType="markdown" />);
    rerender(<TemplateModal {...props} isOpen defaultType="canvas" />);
    expect(screen.getByRole('button', { name: /Core Gameplay Loop/ })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('File Name:').value).toBe('');
    expect(screen.getByPlaceholderText<HTMLInputElement>('Search templates...').value).toBe('');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Create File' }).disabled).toBe(true);
    expect(screen.getByText('.canvas')).toBeTruthy();
  });
});
