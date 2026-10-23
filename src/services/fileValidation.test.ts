import { describe, expect, it } from 'vitest';
import { parseCanvasData, parseKanbanData } from './fileValidation';
import TemplateService from './TemplateService';

describe('persisted file validation', () => {
  it('loads every existing and game board/canvas template', () => {
    for (const template of TemplateService.getInstance().getDefaultTemplates()) {
      const input = JSON.parse(JSON.stringify(template.content));
      if (template.type === 'kanban') expect(parseKanbanData(input)).toEqual(template.content);
      if (template.type === 'canvas') expect(parseCanvasData(input)).toEqual(template.content);
    }
  });

  it('accepts legacy canvas files without card templates and preserves extra data', () => {
    const data = {
      title: 'Old canvas', nodes: [{
        id: 'node', type: 'custom', position: { x: 10, y: 20 },
        style: { width: 200, height: 100 }, data: { content: '', custom: 'keep' },
      }], edges: [], metadata: { keep: true },
    };
    expect(parseCanvasData(data)).toEqual(data);
  });

  it('round-trips per-file card templates, including intentionally empty content', () => {
    const data = {
      title: 'Templates', nodes: [], edges: [],
      cardTemplates: [{ id: 'mechanic', name: 'Mechanic', content: '', width: 200, height: 100 }],
    };
    expect(parseCanvasData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  it.each([
    { title: 'Bad', nodes: [], edges: [], cardTemplates: {} },
    { title: 'Bad', nodes: [], edges: [], cardTemplates: [{ id: 'x', name: '', content: '', width: 200, height: 100 }] },
    { title: 'Bad', nodes: [], edges: [{ id: 'e', source: 'missing', target: 'missing' }] },
    { title: 'Bad', nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 0 } },
  ])('rejects malformed canvas data instead of defaulting: %j', input => {
    expect(() => parseCanvasData(input)).toThrow();
  });

  it('rejects duplicate board column IDs and invalid cards', () => {
    expect(() => parseKanbanData({
      columns: [{ id: 'x', title: 'A', cards: [] }, { id: 'x', title: 'B', cards: [] }],
    })).toThrow('duplicate');
    expect(() => parseKanbanData({ columns: [{ id: 'x', title: 'A', cards: [{}] }] })).toThrow();
  });
});
