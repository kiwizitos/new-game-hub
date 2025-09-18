import React, { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import './CanvasContextMenu.css';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  onClose: () => void;
  nodeId?: string;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ 
  x, 
  y, 
  canvasX,
  canvasY,
  onClose, 
  nodeId 
}) => {
  const { setNodes, addNodes } = useReactFlow();

  const handleAddNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: { 
        x: canvasX - 100, // Centralizar o nó no ponto de clique (largura padrão 200px / 2)
        y: canvasY - 50   // Centralizar o nó no ponto de clique (altura padrão 100px / 2)
      },
      style: { width: 200, height: 100 },
      data: { 
        content: 'Click to edit...' 
      },
    };
    
    addNodes(newNode);
    onClose();
    
    // Colocar o nó em modo de edição imediatamente após criar
    setTimeout(() => {
      const nodeElement = document.querySelector(`[data-id="${newNodeId}"] .custom-node-content`);
      if (nodeElement) {
        (nodeElement as HTMLElement).dispatchEvent(new Event('dblclick', { bubbles: true }));
      }
    }, 100);
  }, [canvasX, canvasY, addNodes, onClose]);

  const handleDeleteNode = useCallback(() => {
    if (nodeId) {
      setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    }
    onClose();
  }, [nodeId, setNodes, onClose]);

  const handleDuplicateNode = useCallback(() => {
    if (nodeId) {
      setNodes((nodes) => {
        const nodeToClone = nodes.find((node) => node.id === nodeId);
        if (nodeToClone) {
          const newNodeId = `node-${Date.now()}`;
          const clonedNode = {
            ...nodeToClone,
            id: newNodeId,
            position: {
              x: nodeToClone.position.x + 20,
              y: nodeToClone.position.y + 20,
            },
          };
          return [...nodes, clonedNode];
        }
        return nodes;
      });
    }
    onClose();
  }, [nodeId, setNodes, onClose]);

  return (
    <div 
      className="canvas-context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="context-menu-item" onClick={handleAddNode}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Node
      </div>
      
      {nodeId && (
        <>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={handleDuplicateNode}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Duplicate
          </div>
          <div className="context-menu-item danger" onClick={handleDeleteNode}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
            </svg>
            Delete
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasContextMenu;
