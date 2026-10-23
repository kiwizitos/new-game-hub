import type { KanbanCard, KanbanData } from '../types/kanban';
import type { CanvasData } from './FileService';

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}: expected an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, nonempty = false): string {
  if (typeof value !== 'string' || (nonempty && !value.trim())) {
    throw new Error(`${label}: expected ${nonempty ? 'nonempty ' : ''}text`);
  }
  return value;
}

function number(value: unknown, label: string, minimum = -Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new Error(`${label}: invalid number`);
  }
  return value;
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label}: expected an array`);
  return value;
}

function uniqueId(value: unknown, ids: Set<string>, label: string): string {
  const id = text(value, label, true);
  if (ids.has(id)) throw new Error(`${label}: duplicate ID "${id}"`);
  ids.add(id);
  return id;
}

function date(value: unknown, label: string): Date {
  if (!(value instanceof Date) && typeof value !== 'string') {
    throw new Error(`${label}: expected a date`);
  }
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) throw new Error(`${label}: invalid date`);
  return result;
}

export function parseKanbanData(value: unknown): KanbanData {
  const data = record(value, 'Board');
  const columnIds = new Set<string>();
  const cardIds = new Set<string>();
  return {
    ...data,
    columns: list(data.columns, 'Columns').map(value => {
      const column = record(value, 'Column');
      const cards: KanbanCard[] = list(column.cards, 'Cards').map(value => {
        const card = record(value, 'Card');
        const priority = card.priority;
        if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
          throw new Error('Card: invalid priority');
        }
        return {
          ...card,
          id: uniqueId(card.id, cardIds, 'Card ID'),
          title: text(card.title, 'Card title', true),
          ...(card.description !== undefined ? { description: text(card.description, 'Description') } : {}),
          priority,
          tags: list(card.tags, 'Tags').map(tag => text(tag, 'Tag')),
          createdAt: date(card.createdAt, 'Created date'),
          updatedAt: date(card.updatedAt, 'Updated date'),
        };
      });
      return {
        ...column,
        id: uniqueId(column.id, columnIds, 'Column ID'),
        title: text(column.title, 'Column title', true),
        ...(column.color !== undefined ? { color: text(column.color, 'Column color') } : {}),
        cards,
      };
    }),
  };
}

export function parseCanvasData(value: unknown): CanvasData {
  const data = record(value, 'Canvas');
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const templateIds = new Set<string>();
  const nodes = list(data.nodes, 'Nodes').map(value => {
    const node = record(value, 'Node');
    const position = record(node.position, 'Position');
    const style = record(node.style, 'Node style');
    const nodeData = record(node.data, 'Node data');
    return {
      ...node,
      id: uniqueId(node.id, nodeIds, 'Node ID'),
      type: text(node.type, 'Node type', true),
      position: { x: number(position.x, 'Position x'), y: number(position.y, 'Position y') },
      style: { ...style, width: number(style.width, 'Width', 1), height: number(style.height, 'Height', 1) },
      data: { ...nodeData, content: text(nodeData.content, 'Node content') },
    };
  });
  const edges = list(data.edges, 'Edges').map(value => {
    const edge = record(value, 'Edge');
    const source = text(edge.source, 'Source', true);
    const target = text(edge.target, 'Target', true);
    if (!nodeIds.has(source) || !nodeIds.has(target)) throw new Error('Edge references an unknown node');
    return {
      ...edge,
      id: uniqueId(edge.id, edgeIds, 'Edge ID'),
      source,
      target,
      ...(edge.sourceHandle != null ? { sourceHandle: text(edge.sourceHandle, 'Source handle') } : {}),
      ...(edge.targetHandle != null ? { targetHandle: text(edge.targetHandle, 'Target handle') } : {}),
    };
  });
  const viewport = data.viewport === undefined ? undefined : record(data.viewport, 'Viewport');
  return {
    ...data,
    title: text(data.title, 'Canvas title'),
    nodes,
    edges,
    ...(viewport ? {
      viewport: {
        x: number(viewport.x, 'Viewport x'),
        y: number(viewport.y, 'Viewport y'),
        zoom: number(viewport.zoom, 'Zoom', Number.EPSILON),
      },
    } : {}),
    ...(data.cardTemplates !== undefined ? {
      cardTemplates: list(data.cardTemplates, 'Card templates').map(value => {
        const template = record(value, 'Card template');
        return {
          id: uniqueId(template.id, templateIds, 'Template ID'),
          name: text(template.name, 'Template name', true),
          content: text(template.content, 'Template content'),
          width: number(template.width, 'Template width', 140),
          height: number(template.height, 'Template height', 80),
        };
      }),
    } : {}),
  };
}
