// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Node, ReactFlowProps } from 'reactflow';
import CanvasView from './CanvasView';
import { useCanvasCards } from './CanvasCardsContext';
import { useAppStore } from '../../stores/appStore';
import type { CanvasData } from '../../services/FileService';

const { invokeMock, showAlert } = vi.hoisted(() => ({ invokeMock: vi.fn(), showAlert: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }));
vi.mock('../../contexts/PopupContext', () => ({ usePopup: () => ({ showAlert }) }));
vi.mock('reactflow', async importOriginal => {
  const actual = await importOriginal<typeof import('reactflow')>();
  return {
    ...actual,
    default: ({ nodes, children }: ReactFlowProps) => <div>
      {nodes?.map(node => <TestNode key={node.id} node={node} />)}{children}
    </div>,
    useReactFlow: () => ({
      screenToFlowPosition: (position: { x: number; y: number }) => position,
      fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(),
    }),
    Controls: () => null,
    MiniMap: () => null,
    Background: () => null,
  };
});

function TestNode({ node }: { node: Node }) {
  const { openCard } = useCanvasCards();
  return <button onClick={() => openCard(node.id)} onDoubleClick={() => openCard(node.id)}>
    Abrir card {node.id}
  </button>;
}

const path = 'C:\\Games\\design.canvas';
let files: Map<string, string>;
const initial: CanvasData = {
  title: 'Design', nodes: [{
    id: 'idea', type: 'custom', position: { x: 0, y: 0 },
    style: { width: 240, height: 160 }, data: { content: '# Original\n\nAll the details' },
  }], edges: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  files = new Map([[path, JSON.stringify(initial)]]);
  useAppStore.setState({ selectedFile: path });
  invokeMock.mockImplementation(async (command: string, args: { filePath: string; content?: string }) => {
    if (command === 'read_file_content') {
      const data = files.get(args.filePath);
      if (data === undefined) throw new Error('File not found');
      return data;
    }
    if (command === 'write_file_content' && args.content !== undefined) {
      files.set(args.filePath, args.content);
      return;
    }
    throw new Error(`Unexpected command: ${command}`);
  });
});
afterEach(cleanup);

describe('per-file canvas customization', () => {
  it('saves a model from an existing card, creates an independent card and reloads both from the file', async () => {
    const { unmount } = render(<CanvasView />);
    fireEvent.doubleClick(await screen.findByRole('button', { name: 'Abrir card idea' }));
    expect(screen.getByText('All the details')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Nome do modelo'), { target: { value: 'Mechanic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como modelo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Modelos de cards' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar card: Mechanic' }));
    expect(screen.getAllByRole('button', { name: /^Abrir card / })).toHaveLength(2);
    const newCard = screen.getAllByRole('button', { name: /^Abrir card / })[1];
    fireEvent.click(newCard);
    fireEvent.click(screen.getByRole('button', { name: 'Editar conteúdo' }));
    fireEvent.change(screen.getByLabelText('Conteúdo Markdown'), { target: { value: '# Changed copy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar canvas' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith(
      'write_file_content', expect.objectContaining({ filePath: path }),
    ));
    const saved = JSON.parse(files.get(path)!);
    expect(saved.cardTemplates[0]).toMatchObject({ name: 'Mechanic', content: initial.nodes[0].data.content });
    expect(saved.nodes[0].data.content).toBe(initial.nodes[0].data.content);
    expect(saved.nodes[1].data.content).toBe('# Changed copy');
    expect(saved.nodes[0].id).not.toBe(saved.nodes[1].id);
    unmount();
    render(<CanvasView />);
    await screen.findByRole('button', { name: 'Abrir card idea' });
    expect(screen.getAllByRole('button', { name: /^Abrir card / })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Modelos de cards' }));
    expect(screen.getByRole('button', { name: 'Criar card: Mechanic' })).toBeTruthy();
  });

  it('isolates models and flushes pending changes when switching canvas files', async () => {
    const other = 'C:\\Games\\other.canvas';
    files.set(other, JSON.stringify({ title: 'Other', nodes: [], edges: [] }));
    render(<CanvasView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir card idea' }));
    fireEvent.change(screen.getByLabelText('Nome do modelo'), { target: { value: 'Local only' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como modelo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal' }));
    act(() => useAppStore.setState({ selectedFile: other }));
    await screen.findByRole('button', { name: 'Modelos de cards' });
    fireEvent.click(screen.getByRole('button', { name: 'Modelos de cards' }));
    expect(screen.queryByRole('button', { name: 'Criar card: Local only' })).toBeNull();
    await waitFor(() => expect(JSON.parse(files.get(path)!).cardTemplates[0].name).toBe('Local only'));
    expect(JSON.parse(files.get(other)!).nodes).toEqual([]);
  });

  it.each(['invalid JSON', '{"title":"Broken","nodes":{},"edges":[]}'])(
    'never overwrites an invalid canvas: %s', async content => {
      files.set(path, content);
      const { unmount } = render(<CanvasView />);
      expect((await screen.findByRole('alert')).textContent).toContain('O arquivo não foi alterado');
      unmount();
      expect(files.get(path)).toBe(content);
      expect(invokeMock.mock.calls.some(([command]) => command === 'write_file_content')).toBe(false);
    },
  );

  it('does not trigger add-card shortcuts while a modal is open', async () => {
    render(<CanvasView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir card idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar conteúdo' }));
    fireEvent.keyDown(screen.getByLabelText('Conteúdo Markdown'), { key: 'n', ctrlKey: true });
    expect(screen.getAllByRole('button', { name: /^Abrir card / })).toHaveLength(1);
  });
});
