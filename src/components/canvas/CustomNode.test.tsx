// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { NodeProps } from 'reactflow';
import type { CanvasNodeData } from '../../types/canvas';
import CustomNode from './CustomNode';
import { CanvasCardsContext } from './CanvasCardsContext';

vi.mock('reactflow', async importOriginal => ({
  ...await importOriginal<typeof import('reactflow')>(),
  Handle: () => null,
}));
vi.mock('@reactflow/node-resizer', () => ({ NodeResizer: () => null }));
afterEach(cleanup);

describe('compact canvas card', () => {
  const props: NodeProps<CanvasNodeData> = {
    id: 'card', type: 'custom', data: { content: '# Idea' },
    xPos: 0, yPos: 0, selected: false, dragging: false, isConnectable: true, zIndex: 0,
  };
  it('opens the full-content modal by double-click or the accessible button', () => {
    const openCard = vi.fn();
    render(<CanvasCardsContext.Provider value={{ openCard }}><CustomNode {...props} /></CanvasCardsContext.Provider>);
    fireEvent.doubleClick(screen.getByRole('heading', { name: 'Idea' }));
    expect(openCard).toHaveBeenCalledWith('card');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir conteúdo completo do card' }));
    expect(openCard).toHaveBeenCalledTimes(2);
  });
  it('reflects updated or empty content without a stale local draft', () => {
    const openCard = vi.fn();
    const { rerender } = render(<CanvasCardsContext.Provider value={{ openCard }}>
      <CustomNode {...props} />
    </CanvasCardsContext.Provider>);
    rerender(<CanvasCardsContext.Provider value={{ openCard }}>
      <CustomNode {...props} data={{ content: '' }} />
    </CanvasCardsContext.Provider>);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByText('Double-click to edit')).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir conteúdo completo do card' })).toBeTruthy();
  });
});
