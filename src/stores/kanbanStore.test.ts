// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useKanbanStore } from './kanbanStore';
import { KanbanData } from '../types/kanban';

export const boardFixture = (): KanbanData => ({
  columns: [
    { id: 'todo', title: 'To Do', color: '#ff0000', cards: [{
      id: 'card-1', title: 'Existing card', description: 'Keep me', priority: 'high', tags: ['game'],
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02')
    }] },
    { id: 'done', title: 'Done', cards: [{
      id: 'card-2', title: 'Finished card', priority: 'low', tags: [],
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02')
    }] },
    { id: 'empty', title: 'Empty', cards: [] }
  ]
});

const store = () => useKanbanStore.getState();
beforeEach(() => { store().setKanbanData(boardFixture()); localStorage.clear(); });

describe('Kanban column operations', () => {
  it('requires a different valid destination before removing a nonempty column', () => {
    const original = store().data;
    for (const destination of [undefined, 'todo', 'missing']) {
      expect(() => store().removeColumn('todo', destination)).toThrow(/Escolha outra coluna/);
      expect(store().data).toBe(original);
    }
    store().removeColumn('todo', 'done');
    expect(store().data.columns.map(column => column.id)).toEqual(['done', 'empty']);
    expect(store().data.columns[0].cards).toEqual([
      original.columns[1].cards[0], original.columns[0].cards[0]
    ]);
  });

  it('allows empty removal, but never the last column', () => {
    store().removeColumn('empty');
    store().removeColumn('todo', 'done');
    const original = store().data;
    expect(() => store().removeColumn('done')).toThrow(/última coluna/);
    expect(store().data).toBe(original);
  });

  it('creates, renames and reorders without changing stable ids, cards or colors', async () => {
    const original = store().data.columns[0];
    store().renameColumn('todo', '  Backlog  ');
    store().reorderColumn('todo', 2);
    store().addColumn('  Review  ');
    expect(store().data.columns.map(column => column.title)).toEqual(['Done', 'Empty', 'Backlog', 'Review']);
    expect(store().data.columns[2]).toEqual({ ...original, title: 'Backlog' });
    const exported = JSON.parse(await store().exportKanbanData());
    expect(exported.columns.map((column: { title: string }) => column.title)).toEqual(['Done', 'Empty', 'Backlog', 'Review']);
    expect(exported.columns[2].cards[0].description).toBe('Keep me');
  });

  it('rejects blank/duplicate titles and invalid reorder targets without mutation', () => {
    const original = store().data;
    expect(() => store().addColumn('  ')).toThrow();
    expect(() => store().renameColumn('todo', ' done ')).toThrow();
    expect(() => store().reorderColumn('todo', -1)).toThrow();
    expect(() => store().reorderColumn('missing', 0)).toThrow();
    expect(store().data).toBe(original);
  });

  it('never loses a card when moving to a nonexistent target, or duplicates same-column moves', () => {
    const original = store().data;
    store().moveCard('card-1', 'missing');
    store().moveCard('card-1', 'todo');
    store().moveCard('missing', 'done');
    expect(store().data).toBe(original);
    store().moveCard('card-1', 'done');
    expect(store().data.columns[0].cards).toEqual([]);
    expect(store().data.columns[1].cards.map(card => card.id)).toEqual(['card-2', 'card-1']);
  });

  it('rejects malformed imports without changing existing cards or saved data', async () => {
    const original = store().data;
    localStorage.setItem('kanban-data', 'previous saved data');
    await expect(store().importKanbanData('{"columns":[{"id":"bad","title":"Bad","cards":null}]}')).rejects.toThrow();
    expect(store().data).toBe(original);
    expect(localStorage.getItem('kanban-data')).toBe('previous saved data');
    await store().importKanbanData(JSON.stringify(boardFixture()));
    expect(store().data.columns[0].cards[0].createdAt).toBeInstanceOf(Date);
  });
});
