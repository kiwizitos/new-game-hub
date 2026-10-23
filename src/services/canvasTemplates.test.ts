import { describe, expect, it } from 'vitest';
import { saveCardTemplate } from './canvasTemplates';

const model = { id: 'm', name: ' Mechanic ', content: '# Rules', width: 240, height: 160 };

describe('canvas card models', () => {
  it('creates independent models and trims their names', () => {
    const saved = saveCardTemplate([], model);
    expect(saved[0].name).toBe('Mechanic');
    expect(saved[0]).not.toBe(model);
    expect(model.name).toBe(' Mechanic ');
  });
  it('updates only the matching model and does not mutate existing content', () => {
    const initial = saveCardTemplate([], model);
    const updated = saveCardTemplate(initial, { ...model, content: 'New rules' });
    expect(updated).toHaveLength(1);
    expect(updated[0].content).toBe('New rules');
    expect(initial[0].content).toBe('# Rules');
  });
  it('rejects empty names, duplicate names and invalid sizes', () => {
    expect(() => saveCardTemplate([], { ...model, name: ' ' })).toThrow('nome');
    expect(() => saveCardTemplate([model], { ...model, id: 'other', name: 'mechanic' })).toThrow('existe');
    expect(() => saveCardTemplate([], { ...model, width: 139 })).toThrow('140 x 80');
    expect(() => saveCardTemplate([], { ...model, height: NaN })).toThrow('140 x 80');
  });
});
