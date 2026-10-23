// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import KanbanBoard from './KanbanBoard';
import { useKanbanStore } from '../../stores/kanbanStore';
import { useAppStore } from '../../stores/appStore';
import { KanbanData } from '../../types/kanban';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
const showAlert = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/PopupContext', () => ({
  usePopup: () => ({ showAlert, showConfirm: vi.fn() })
}));

const fixture = (): KanbanData => ({
  columns: [
    { id: 'todo', title: 'To Do', cards: [{
      id: 'existing', title: 'Existing card', priority: 'high', tags: ['keep'],
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01')
    }] },
    { id: 'done', title: 'Done', cards: [] }
  ]
});
const mockedInvoke = vi.mocked(invoke);
const pathA = 'C:\\boards\\a.kanban';
const pathB = 'C:\\boards\\b.kanban';
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const advanceSave = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(2100); }); };
const writes = () => mockedInvoke.mock.calls.filter(([command]) => command === 'write_file_content');

beforeEach(() => {
  vi.useFakeTimers();
  showAlert.mockReset();
  mockedInvoke.mockReset();
  mockedInvoke.mockImplementation(async command => command === 'read_file_content' ? JSON.stringify(fixture()) : undefined);
  useAppStore.setState({ selectedFile: pathA });
  useKanbanStore.getState().setKanbanData({ columns: [] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('customizable persisted board', () => {
  it('validates names, creates, renames, reorders and safely migrates existing cards in the .kanban file', async () => {
    render(<KanbanBoard />);
    await flush();
    await advanceSave();
    expect(writes()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Personalizar colunas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar coluna' }));
    expect(screen.getByRole('alert').textContent).toContain('Informe um nome');
    fireEvent.change(screen.getByLabelText('Nome da nova coluna'), { target: { value: 'Review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar coluna' }));
    fireEvent.click(screen.getByRole('button', { name: 'Renomear To Do' }));
    fireEvent.change(screen.getByLabelText('Novo nome da coluna'), { target: { value: 'Backlog' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mover Review para a esquerda' }));
    await advanceSave();
    const customized = JSON.parse((writes().at(-1)![1] as { content: string }).content);
    expect(customized.columns.map((column: { title: string }) => column.title)).toEqual(['Backlog', 'Review', 'Done']);
    expect(customized.columns[0].id).toBe('todo');
    expect(customized.columns[0].cards).toEqual(JSON.parse(JSON.stringify(fixture().columns[0].cards)));
    fireEvent.click(screen.getByRole('button', { name: 'Remover Backlog' }));
    expect(screen.getByLabelText<HTMLSelectElement>('Coluna de destino').value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(screen.getByRole('alert').textContent).toContain('Escolha outra coluna');
    expect(useKanbanStore.getState().data.columns).toHaveLength(3);
    fireEvent.change(screen.getByLabelText('Coluna de destino'), { target: { value: 'done' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    await advanceSave();
    const write = writes().at(-1)![1] as { filePath: string; content: string };
    expect(write.filePath).toBe(pathA);
    const saved = JSON.parse(write.content);
    expect(saved.columns.map((column: { title: string }) => column.title)).toEqual(['Review', 'Done']);
    expect(saved.columns[1].cards[0]).toEqual(JSON.parse(JSON.stringify(fixture().columns[0].cards[0])));
    fireEvent.click(screen.getByRole('button', { name: 'Remover Review' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Remover Done' }).disabled).toBe(true);
  });

  it.each(['{broken json', '{"columns":null}', '{"columns":[{"id":"bad","title":"Bad","cards":null}]}'])(
    'shows malformed file errors without overwriting: %s', async content => {
      mockedInvoke.mockResolvedValue(content);
      render(<KanbanBoard />);
      await flush();
      expect(screen.getByRole('alert').textContent).toContain('O arquivo não foi alterado');
      await advanceSave();
      expect(writes()).toHaveLength(0);
    }
  );

  it('does not overwrite unreadable files or expose the previous file state', async () => {
    render(<KanbanBoard />);
    await flush();
    expect(screen.getByText('Existing card')).toBeTruthy();
    mockedInvoke.mockRejectedValue(new Error('Access denied'));
    act(() => { useAppStore.setState({ selectedFile: pathB }); });
    await flush();
    expect(screen.queryByText('Existing card')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Access denied');
    await advanceSave();
    expect(writes()).toHaveLength(0);
  });

  it('ignores disposed loads and flushes edits to their own file when leaving the board', async () => {
    let resolveA!: (value: string) => void;
    mockedInvoke.mockImplementation(async (command, args) => {
      if (command !== 'read_file_content') return;
      if ((args as { filePath: string }).filePath === pathA) return new Promise<string>(resolve => { resolveA = resolve; });
      return JSON.stringify({ columns: [{ id: 'b', title: 'Only B', cards: [] }] });
    });
    render(<KanbanBoard />);
    act(() => { useAppStore.setState({ selectedFile: pathB }); });
    await flush();
    await act(async () => { resolveA(JSON.stringify(fixture())); });
    expect(screen.getByText('Only B')).toBeTruthy();
    expect(screen.queryByText('Existing card')).toBeNull();
    act(() => { useKanbanStore.getState().renameColumn('b', 'Edited B'); });
    act(() => { useAppStore.setState({ selectedFile: null }); });
    await advanceSave();
    expect(writes()).toHaveLength(1);
    const write = writes()[0][1] as { filePath: string; content: string };
    expect(write.filePath).toBe(pathB);
    expect(JSON.parse(write.content).columns[0].title).toBe('Edited B');
  });

  it('reports explicit Save success only after the write succeeds', async () => {
    render(<KanbanBoard />);
    await flush();
    act(() => { useKanbanStore.getState().renameColumn('todo', 'Saved now'); });
    mockedInvoke.mockImplementation(async command => {
      if (command === 'write_file_content') throw new Error('disk full');
    });
    await act(async () => { fireEvent.click(screen.getByTitle('Salvar dados')); });
    expect(showAlert).not.toHaveBeenCalledWith('Sucesso', expect.anything(), 'success');
    expect(showAlert).toHaveBeenCalledWith('Auto-save Error', expect.stringContaining('disk full'), 'error');
    mockedInvoke.mockImplementation(async () => undefined);
    await act(async () => { fireEvent.click(screen.getByTitle('Salvar dados')); });
    expect(showAlert).toHaveBeenCalledWith('Sucesso', 'Dados salvos com sucesso!', 'success');
    const write = writes().at(-1)![1] as { filePath: string; content: string };
    expect(write.filePath).toBe(pathA);
    expect(JSON.parse(write.content).columns[0].title).toBe('Saved now');
  });

  it('does not save a previous board snapshot into the next selected file', async () => {
    render(<KanbanBoard />);
    await flush();
    act(() => { useKanbanStore.getState().renameColumn('todo', 'Unsaved A'); });
    mockedInvoke.mockImplementation(async command => command === 'read_file_content'
      ? JSON.stringify({ columns: [{ id: 'b', title: 'Only B', cards: [] }] }) : undefined);
    act(() => { useAppStore.setState({ selectedFile: pathB }); });
    await flush();
    await advanceSave();
    expect(writes()).toHaveLength(1);
    const previousWrite = writes()[0][1] as { filePath: string; content: string };
    expect(previousWrite.filePath).toBe(pathA);
    expect(JSON.parse(previousWrite.content).columns[0].title).toBe('Unsaved A');
    expect(screen.queryByText('Unsaved A')).toBeNull();
    act(() => { useKanbanStore.getState().renameColumn('b', 'Changed B'); });
    await advanceSave();
    const write = writes()[1][1] as { filePath: string; content: string };
    expect(write.filePath).toBe(pathB);
    expect(JSON.parse(write.content).columns).toEqual([{ id: 'b', title: 'Changed B', cards: [] }]);
  });
});
