// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import KanbanDataManager from './KanbanDataManager';

const showAlert = vi.fn();
vi.mock('../../contexts/PopupContext', () => ({ usePopup: () => ({ showAlert }) }));

afterEach(() => { cleanup(); showAlert.mockReset(); });

const clickSave = async () => {
  await act(async () => { fireEvent.click(screen.getByTitle('Salvar dados')); });
};

describe('explicit Kanban save reporting', () => {
  it('reports success only when the save resolves true', async () => {
    render(<KanbanDataManager onSave={vi.fn().mockResolvedValue(true)} />);
    await clickSave();
    expect(showAlert).toHaveBeenCalledWith('Sucesso', 'Dados salvos com sucesso!', 'success');
  });

  it('does not report success when saving fails or is disabled', async () => {
    render(<KanbanDataManager onSave={vi.fn().mockResolvedValue(false)} />);
    await clickSave();
    expect(showAlert).not.toHaveBeenCalled();
  });

  it('reports thrown save errors', async () => {
    render(<KanbanDataManager onSave={vi.fn().mockRejectedValue(new Error('disk'))} />);
    await clickSave();
    expect(showAlert).toHaveBeenCalledWith('Erro', 'Erro ao salvar dados', 'error');
  });
});
