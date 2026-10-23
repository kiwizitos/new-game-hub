// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import FileExplorer from './FileExplorer';
import { useAppStore } from '../../stores/appStore';

const { showAlert } = vi.hoisted(() => ({ showAlert: vi.fn() }));

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../../hooks/useFileWatcher', () => ({ useFileWatcher: vi.fn() }));
vi.mock('../../contexts/PopupContext', () => ({
  usePopup: () => ({ showAlert, showConfirm: vi.fn(), showInput: vi.fn() }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  useAppStore.setState({ currentFolder: null });
  vi.mocked(invoke).mockResolvedValue([]);
});

afterEach(cleanup);

describe('workspace folder selection', () => {
  it('opens a native directory-only dialog and persists a readable folder', async () => {
    const path = 'C:\\Games\\My Project';
    vi.mocked(open).mockResolvedValue(path);
    vi.mocked(invoke).mockResolvedValue([
      { name: 'design.md', path: `${path}\\design.md`, is_dir: false },
    ]);
    render(<FileExplorer />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar Pasta' }));
    await screen.findByText('design');
    expect(open).toHaveBeenCalledWith({
      directory: true, multiple: false, title: 'Selecionar pasta do workspace',
    });
    expect(invoke).toHaveBeenCalledWith('read_dir_tree', { path });
    expect(useAppStore.getState().currentFolder).toBe(path);
    expect(localStorage.getItem('fileExplorer-rootPath')).toBe(path);
    expect(localStorage.getItem('game-hub-current-folder')).toBe(path);
  });

  it('restores the workspace and preserves it when the native dialog is cancelled', async () => {
    const path = 'C:\\Games\\Existing';
    localStorage.setItem('fileExplorer-rootPath', path);
    vi.mocked(open).mockResolvedValue(null);
    render(<FileExplorer />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Trocar Pasta' });
    await waitFor(() => expect(button.disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: path }));
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().currentFolder).toBe(path);
    expect(localStorage.getItem('fileExplorer-rootPath')).toBe(path);
    expect(showAlert).not.toHaveBeenCalled();
  });

  it.each(['dialog', 'directory'])('shows %s errors without replacing the current workspace', async failure => {
    const path = 'C:\\Games\\Existing';
    localStorage.setItem('fileExplorer-rootPath', path);
    render(<FileExplorer />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Trocar Pasta' });
    await waitFor(() => expect(button.disabled).toBe(false));
    if (failure === 'dialog') {
      vi.mocked(open).mockRejectedValueOnce(new Error('Dialog unavailable'));
    } else {
      vi.mocked(open).mockResolvedValueOnce('C:\\Games\\Inaccessible');
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Access denied'));
    }
    fireEvent.click(button);
    await waitFor(() => expect(showAlert).toHaveBeenCalledWith(
      'Erro ao abrir pasta', expect.stringContaining(
        failure === 'dialog' ? 'Dialog unavailable' : 'Access denied',
      ), 'error',
    ));
    expect(useAppStore.getState().currentFolder).toBe(path);
    expect(localStorage.getItem('fileExplorer-rootPath')).toBe(path);
    expect(button.disabled).toBe(false);
  });

  it('does not persist a workspace when the first selection is cancelled', async () => {
    vi.mocked(open).mockResolvedValue(null);
    render(<FileExplorer />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Selecionar Pasta' });
    fireEvent.click(button);
    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(useAppStore.getState().currentFolder).toBeNull();
    expect(localStorage.getItem('fileExplorer-rootPath')).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });
});
