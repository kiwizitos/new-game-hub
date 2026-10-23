import { describe, expect, it } from 'vitest';
import TemplateService from './TemplateService';

const service = TemplateService.getInstance();

describe('template catalog', () => {
  it('preserves every existing template and adds six game templates', () => {
    const ids = service.getDefaultTemplates().map(template => template.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([
      'md-blank', 'md-note', 'md-meeting', 'md-project',
      'kanban-basic', 'kanban-agile', 'kanban-personal',
      'canvas-blank', 'canvas-mindmap', 'canvas-flowchart',
      'md-game-design', 'md-game-mechanic', 'md-game-playtest',
      'kanban-game-production', 'kanban-game-bugs', 'canvas-game-loop',
    ]));
    expect(ids).toHaveLength(16);
  });

  it.each(['markdown', 'kanban', 'canvas'] as const)('filters %s templates by type', type => {
    const templates = service.getTemplatesByType(type);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every(template => template.type === type)).toBe(true);
    expect(templates[0].tags).toContain('game');
  });

  it('exposes game categories and lookup without changing unknown-ID behavior', () => {
    expect(service.getCategories()).toEqual(expect.arrayContaining([
      'Game Design', 'Game Production', 'Game Testing',
    ]));
    expect(service.getTemplatesByCategory('Game Design').map(template => template.id))
      .toContain('md-game-design');
    expect(service.getTemplateById('unknown')).toBeNull();
  });

  it('provides concrete design, mechanic and playtest prompts', () => {
    for (const [id, sections] of [
      ['md-game-design', ['Core Loop', 'Scope and Milestones', 'Definition of Done']],
      ['md-game-mechanic', ['State Transitions', 'Edge Cases', 'Acceptance Criteria']],
      ['md-game-playtest', ['Build / commit', 'Observations', 'Retest criterion']],
    ] as const) {
      const template = service.getTemplateById(id);
      expect(template?.type).toBe('markdown');
      for (const section of sections) expect(template?.content).toContain(section);
    }
  });

  it('creates independent, serializable boards with valid cards and columns', () => {
    for (const id of ['kanban-game-production', 'kanban-game-bugs']) {
      const first = service.getTemplateById(id);
      const second = service.getTemplateById(id);
      if (first?.type !== 'kanban' || second?.type !== 'kanban') throw new Error('Missing board');
      const { columns } = first.content;
      expect(new Set(columns.map(column => column.id)).size).toBe(columns.length);
      expect(columns).toHaveLength(5);
      const cards = columns.flatMap(column => column.cards);
      expect(cards.length).toBeGreaterThan(0);
      expect(new Set(cards.map(card => card.id)).size).toBe(cards.length);
      for (const card of cards) {
        expect(card.title).not.toBe('');
        expect(card.description).not.toBe('');
        expect(['low', 'medium', 'high']).toContain(card.priority);
        expect(Number.isNaN(card.createdAt.getTime())).toBe(false);
      }
      expect(JSON.parse(JSON.stringify(first.content)).columns).toHaveLength(5);
      columns[0].cards[0].title = 'Changed';
      expect(second.content.columns[0].cards[0].title).not.toBe('Changed');
    }
  });

  it('provides connected canvas nodes with handles supported by CustomNode', () => {
    const template = service.getTemplateById('canvas-game-loop');
    if (template?.type !== 'canvas') throw new Error('Missing canvas');
    const { nodes, edges } = template.content;
    const ids = new Set(nodes.map(node => node.id));
    expect(ids.size).toBe(6);
    expect(new Set(edges.map(edge => edge.id)).size).toBe(edges.length);
    for (const node of nodes) {
      expect(node.type).toBe('custom');
      expect(node.data.content).not.toBe('');
      expect(node.style.width).toBeGreaterThanOrEqual(140);
      expect(node.style.height).toBeGreaterThanOrEqual(80);
      expect(edges.some(edge => edge.source === node.id || edge.target === node.id)).toBe(true);
    }
    for (const edge of edges) {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
      expect(['top', 'bottom', 'left', 'right']).toContain(edge.sourceHandle);
      expect(['top', 'bottom', 'left', 'right']).toContain(edge.targetHandle);
    }
    expect(edges).toContainEqual(expect.objectContaining({ source: 'progression', target: 'goal' }));
    expect(JSON.parse(JSON.stringify(template.content))).toEqual(template.content);
  });
});
