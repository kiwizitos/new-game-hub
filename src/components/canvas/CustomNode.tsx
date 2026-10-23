import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import type { CanvasNodeData } from '../../types/canvas';
import { useCanvasCards } from './CanvasCardsContext';
import CardContent from './CardContent';
import '@reactflow/node-resizer/dist/style.css';
import './CustomNode.css';

const CustomNode = ({ id, data, isConnectable, selected }: NodeProps<CanvasNodeData>) => {
  const { openCard } = useCanvasCards();
  return (
    <div className="custom-node">
      <NodeResizer minWidth={140} minHeight={80} isVisible={selected} />
      {([
        ['top', Position.Top], ['left', Position.Left],
        ['right', Position.Right], ['bottom', Position.Bottom],
      ] as const).map(([handleId, position]) => (
        <Handle key={handleId} type="source" position={position} id={handleId}
          isConnectable={isConnectable} className={`custom-handle custom-handle-${handleId}`} />
      ))}
      <div className="custom-node-content" onDoubleClick={event => {
        event.stopPropagation();
        openCard(id);
      }}>
        <CardContent content={data.content} className="custom-node-body" />
        <button type="button" className="custom-node-open nodrag nopan"
          onClick={() => openCard(id)} aria-label="Abrir conteúdo completo do card">
          Abrir card
        </button>
      </div>
    </div>
  );
};

export default memo(CustomNode);
