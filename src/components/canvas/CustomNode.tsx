import React, { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import './CustomNode.css';

interface CustomNodeData {
  content: string;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ 
  id, 
  data, 
  isConnectable
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || 'Double-click to edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes } = useReactFlow();

  // Salvar conteúdo quando sair da edição
  const handleBlur = useCallback(() => {
    if (isEditing) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, content } }
            : node
        )
      );
      setIsEditing(false);
    }
  }, [content, id, setNodes, isEditing]);

  // Entrar em modo de edição
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  // Mudança do conteúdo da textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  // Renderizar Markdown básico (preview)
  const renderMarkdown = useCallback((text: string) => {
    if (!text || text === 'Double-click to edit') return text;
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/\n/g, '<br>');
  }, []);

  return (
    <div className={`custom-node ${isEditing ? 'editing' : ''}`}>
      {/* Node Resizer - invisível mas funcional */}
      <NodeResizer
        minWidth={140}
        minHeight={80}
        isVisible={true}
        handleStyle={{
          backgroundColor: 'transparent',
          border: 'none',
          width: '6px',
          height: '6px',
        }}
        lineStyle={{
          border: 'none',
          borderColor: 'transparent',
        }}
      />
      
      {/* Handles únicos - funcionam como source E target com connectionMode="Loose" */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        className="custom-handle custom-handle-top"
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        className="custom-handle custom-handle-left"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        className="custom-handle custom-handle-right"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        className="custom-handle custom-handle-bottom"
      />

      {/* Conteúdo do nó */}
      <div className="custom-node-content" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <div className="custom-node-editor">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onBlur={handleBlur}
              className="custom-node-content-editor"
              placeholder="Enter markdown content..."
              rows={3}
            />
          </div>
        ) : (
          <div className="custom-node-preview">
            <div 
              className="custom-node-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);
