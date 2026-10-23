import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import FileService from './FileService';
import TemplateService from './TemplateService';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe('game template persistence', () => {
  const templates = TemplateService.getInstance().getDefaultTemplates()
    .filter(template => template.tags.includes('game'));
  const files = FileService.getInstance();

  it.each(templates)('writes and reloads $name using the existing file format', async template => {
    const basePath = 'C:\\Games\\My Project\\template';
    const path = `${basePath}.${template.type === 'markdown' ? 'md' : template.type}`;
    vi.mocked(invoke).mockResolvedValue(undefined);

    switch (template.type) {
      case 'markdown':
        await files.saveMarkdownFile(basePath, template.content);
        break;
      case 'kanban':
        await files.createKanbanFile(basePath, template.content);
        break;
      case 'canvas':
        await files.createCanvasFile(basePath, template.content);
        break;
    }

    const content = template.type === 'markdown' ? template.content : JSON.stringify(template.content, null, 2);
    expect(invoke).toHaveBeenCalledWith('write_file_content', { filePath: path, content });
    vi.mocked(invoke).mockResolvedValueOnce(content);

    switch (template.type) {
      case 'markdown':
        expect(await files.loadMarkdownFile(path)).toBe(template.content);
        break;
      case 'kanban':
        expect(await files.loadKanbanFile(path)).toEqual(template.content);
        break;
      case 'canvas':
        expect(await files.loadCanvasFile(path)).toEqual(template.content);
        break;
    }
    expect(invoke).toHaveBeenLastCalledWith('read_file_content', { filePath: path });
  });

  describe('writes when switching and reopening a file', () => {
    it('waits for all queued writes before reading the same file again', async () => {
      const files = FileService.getInstance();
      const path = 'C:\\Games\\queued.canvas';
      let finishFirst: () => void = () => {};
      let finishSecond: () => void = () => {};
      const first = new Promise<void>(resolve => { finishFirst = resolve; });
      const second = new Promise<void>(resolve => { finishSecond = resolve; });
      const oldData = { title: 'Old', nodes: [], edges: [] };
      const latestData = { title: 'Latest', nodes: [], edges: [], cardTemplates: [] };
      vi.mocked(invoke).mockReturnValueOnce(first).mockReturnValueOnce(second)
        .mockResolvedValueOnce(JSON.stringify(latestData));
      const firstWrite = files.createCanvasFile(path, oldData);
      const secondWrite = files.createCanvasFile(path, latestData);
      const read = files.loadCanvasFile(path);
      expect(invoke).toHaveBeenCalledTimes(1);
      finishFirst();
      await firstWrite;
      expect(invoke).toHaveBeenCalledTimes(2);
      finishSecond();
      await secondWrite;
      expect(await read).toEqual(latestData);
      expect(invoke).toHaveBeenLastCalledWith('read_file_content', { filePath: path });
    });

    it('surfaces failed writes but allows a later explicit write to retry', async () => {
      const files = FileService.getInstance();
      const data = { title: 'Retry', nodes: [], edges: [] };
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Disk full')).mockResolvedValueOnce(undefined);
      await expect(files.createCanvasFile('C:\\Games\\retry.canvas', data)).rejects.toThrow('Disk full');
      await expect(files.createCanvasFile('C:\\Games\\retry.canvas', data)).resolves.toBeUndefined();
    });
  });
});
