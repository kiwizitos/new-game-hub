import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  type Node, type Edge, type Connection, type Viewport,
  addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState,
  ConnectionMode, BackgroundVariant, ReactFlowProvider, useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import CanvasToolbar from './CanvasToolbar';
import CardDetailModal from './CardDetailModal';
import CardTemplatesModal from './CardTemplatesModal';
import { CanvasCardsContext } from './CanvasCardsContext';
import FileService, { type CanvasData } from '../../services/FileService';
import { saveCardTemplate } from '../../services/canvasTemplates';
import type { CanvasCardTemplate, CanvasNodeData } from '../../types/canvas';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useAppStore } from '../../stores/appStore';
import ViewPlaceholder from '../common/ViewPlaceholder';
import './CanvasView.css';

const nodeTypes = { custom: CustomNode };
const fileService = FileService.getInstance();

interface CanvasEditorProps {
  file: string;
  initialData: CanvasData;
}

function CanvasEditor({ file, initialData }: CanvasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeData>(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);
  const [templates, setTemplates] = useState(initialData.cardTemplates ?? []);
  const [viewport, setViewport] = useState<Viewport>(initialData.viewport ?? { x: 0, y: 0, zoom: 1 });
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  const data = useMemo((): CanvasData => ({
    ...initialData,
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type || 'custom',
      position: node.position,
      data: node.data,
      style: {
        ...node.style,
        width: typeof node.style?.width === 'number' ? node.style.width : 200,
        height: typeof node.style?.height === 'number' ? node.style.height : 100,
      },
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
    })),
    viewport,
    cardTemplates: templates,
  }), [initialData, nodes, edges, viewport, templates]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await fileService.createCanvasFile(file, data);
    } finally {
      setIsSaving(false);
    }
  }, [file, data]);
  const { forceSave } = useAutoSave(data, { onSave: save, saveOnUnmount: true });

  const addNode = useCallback((template?: CanvasCardTemplate) => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const node: Node<CanvasNodeData> = {
      id: crypto.randomUUID(),
      type: 'custom',
      position: {
        x: Math.round(position.x / 20) * 20,
        y: Math.round(position.y / 20) * 20,
      },
      style: { width: template?.width ?? 240, height: template?.height ?? 160 },
      data: { content: template?.content ?? '# Nova ideia\n\nDescreva sua ideia aqui.' },
    };
    setNodes(current => [...current, node]);
  }, [screenToFlowPosition, setNodes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        addNode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addNode]);

  const card = nodes.find(node => node.id === openCardId);
  const onConnect = useCallback((connection: Connection) =>
    setEdges(current => addEdge(connection, current)), [setEdges]);
  const onEdgeUpdate = useCallback((oldEdge: Edge, connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const { source, target } = connection;
    setEdges(current => current.map(edge => edge.id === oldEdge.id ? {
      ...edge, source, target, sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle,
    } : edge));
  }, [setEdges]);

  return (
    <CanvasCardsContext.Provider value={{ openCard: setOpenCardId }}>
      <div className="canvas-container" onContextMenu={event => event.preventDefault()}>
        <div className="canvas-header">
          <div className="canvas-title">
            <span className="file-name">{fileService.getFileNameWithoutExtension(file)}
              {isSaving && <span className="save-indicator"> •</span>}
            </span>
            <span className="file-path">{file}</span>
          </div>
        </div>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateEnd={(event, edge) => {
            if (event.target instanceof Element && !event.target.closest('.react-flow__handle')) {
              setEdges(current => current.filter(item => item.id !== edge.id));
            }
          }}
          onMoveEnd={(_, nextViewport) => setViewport(nextViewport)}
          nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose}
          snapToGrid snapGrid={[20, 20]}
          fitView={!initialData.viewport} fitViewOptions={{ padding: 0.1 }}
          defaultViewport={initialData.viewport ?? { x: 0, y: 0, zoom: 1 }}
          className="canvas-flow" minZoom={0.1} maxZoom={4}
          zoomOnDoubleClick={false}
          deleteKeyCode={openCardId || showTemplates ? null : 'Backspace'}
        >
          <CanvasToolbar onAddNode={() => addNode()} onOpenTemplates={() => setShowTemplates(true)}
            onSave={() => void forceSave()} isSaving={isSaving} />
          <Controls className="canvas-controls" />
          <MiniMap className="canvas-minimap" nodeColor={() => 'var(--accent)'} position="bottom-right" />
          <Background variant={BackgroundVariant.Lines} gap={20} size={1} className="canvas-background" />
        </ReactFlow>
      </div>
      {card && <CardDetailModal key={card.id} content={card.data.content}
        onClose={() => setOpenCardId(null)}
        onSave={content => setNodes(current => current.map(node => node.id === card.id
          ? { ...node, data: { ...node.data, content } } : node))}
        onSaveTemplate={(name, content) => {
          const next = saveCardTemplate(templates, {
            id: crypto.randomUUID(), name, content,
            width: Math.max(140, typeof card.style?.width === 'number' ? card.style.width : 240),
            height: Math.max(80, typeof card.style?.height === 'number' ? card.style.height : 160),
          });
          setTemplates(next);
        }} />}
      {showTemplates && <CardTemplatesModal templates={templates}
        onClose={() => setShowTemplates(false)}
        onCreateCard={addNode}
        onSave={template => setTemplates(saveCardTemplate(templates, template))}
        onDelete={id => setTemplates(current => current.filter(template => template.id !== id))} />}
    </CanvasCardsContext.Provider>
  );
}

function CanvasDocument({ file }: { file: string }) {
  const [data, setData] = useState<CanvasData | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    setError('');
    setData(null);
    fileService.loadCanvasFile(file).then(loaded => {
      if (!disposed) setData(loaded);
    }).catch(error => {
      console.error('Error loading canvas file:', error);
      if (!disposed) setError(`Não foi possível abrir o canvas: ${error}`);
    });
    return () => { disposed = true; };
  }, [file, attempt]);

  if (error) return <div className="canvas-loading" role="alert">
    <p>{error}</p><p>O arquivo não foi alterado.</p>
    <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>
  </div>;
  if (!data) return <div className="canvas-loading">Carregando canvas...</div>;
  return <ReactFlowProvider><CanvasEditor file={file} initialData={data} /></ReactFlowProvider>;
}

export default function CanvasView() {
  const file = useAppStore(state => state.selectedFile);
  if (!file || !file.toLowerCase().endsWith('.canvas')) return <ViewPlaceholder
    type="canvas" title="Canvas" description="Conecte ideias e organize seu game visualmente."
    currentFile={file} expectedFileType=".canvas" />;
  return <CanvasDocument key={file} file={file} />;
}
