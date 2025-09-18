import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import CanvasToolbar from './CanvasToolbar';
import FileService, { CanvasData } from '../../services/FileService';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useAppStore } from '../../stores/appStore';
import ViewPlaceholder from '../common/ViewPlaceholder';
import './CanvasView.css';

// Definir tipos de nós customizados
const nodeTypes = {
  custom: CustomNode,
};

// Dados iniciais para teste (alinhados ao grid de 20x20)
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 260, y: 20 },
    style: { width: 260, height: 120 },
    data: { 
      content: '# Ideia Principal\n\nEsta é uma nota principal que conecta várias ideias relacionadas.\n\n**Markdown** funciona perfeitamente!'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 200 },
    style: { width: 200, height: 100 },
    data: { 
      content: '## Conceito A\n\nDetalhes sobre o primeiro conceito importante:\n- Item 1\n- Item 2\n- `código`'
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 400, y: 200 },
    style: { width: 220, height: 100 },
    data: { 
      content: '### Conceito B\n\nInformações sobre o segundo conceito relevante.\n\n*Texto em itálico* e **negrito**.'
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 260, y: 360 },
    style: { width: 180, height: 80 },
    data: { 
      content: '## Conclusão\n\nSíntese das ideias apresentadas acima.\n\n`Resumo final`'
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e1-3', source: '1', target: '3', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e2-4', source: '2', target: '4', sourceHandle: 'bottom', targetHandle: 'left' },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'bottom', targetHandle: 'right' },
];

const CanvasFlow: React.FC = () => {
  const { selectedFile } = useAppStore();
  const { getViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  
  const fileService = FileService.getInstance();

  // Create canvas data for auto-save
  const createCanvasData = useCallback((): CanvasData => {
    const viewport = getViewport();
    return {
      title: currentFile ? fileService.getFileNameWithoutExtension(currentFile) : 'Canvas',
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type || 'custom',
        position: { x: node.position.x, y: node.position.y },
        style: { 
          width: typeof node.style?.width === 'number' ? node.style.width : 200, 
          height: typeof node.style?.height === 'number' ? node.style.height : 100 
        },
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
      })),
      viewport: {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      },
    };
  }, [nodes, edges, getViewport, currentFile, fileService]);

  // Auto-save hook
  const { isSaving } = useAutoSave(createCanvasData(), {
    onSave: async () => {
      if (!currentFile) return;
      const data = createCanvasData();
      await fileService.createCanvasFile(currentFile, data);
    },
    enabled: !!currentFile,
  });

  // Load file when selectedFile changes
  useEffect(() => {
    const loadFile = async () => {
      if (!selectedFile || !selectedFile.endsWith('.canvas')) return;
      
      setIsLoading(true);
      try {
        const canvasData = await fileService.loadCanvasFile(selectedFile);
        
        // Convert loaded data to ReactFlow format
        const loadedNodes: Node[] = canvasData.nodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          style: node.style,
          data: node.data,
        }));
        
        const loadedEdges: Edge[] = canvasData.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        }));
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setCurrentFile(selectedFile);
        
        // Restore viewport if available
        if (canvasData.viewport) {
          // Note: Viewport restoration might need to be done after the next render
          setTimeout(() => {
            const reactFlowInstance = getViewport();
            if (reactFlowInstance) {
              // You might need to use the ReactFlow instance methods here
              // This is a limitation of the current implementation
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error loading canvas file:', error);
        
        // Verificar se o erro é de arquivo não encontrado
        const errorMessage = String(error);
        if (errorMessage.includes('não pode encontrar o arquivo') || 
            errorMessage.includes('No such file') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('os error 2')) {
          // Arquivo foi deletado - limpar seleção para voltar ao placeholder
          const { setSelectedFile } = useAppStore.getState();
          setSelectedFile(null);
          setCurrentFile(null);
        }
        // Para outros erros, mantém o canvas vazio mas não limpa a seleção
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [selectedFile, setNodes, setEdges, getViewport, fileService]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Função para adicionar um novo nó
  const addNewNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    
    // Calcular posição alinhada ao grid (20x20)
    const gridSize = 20;
    const baseX = 100;
    const baseY = 100;
    const offsetX = (nodes.length % 10) * 240;
    const offsetY = Math.floor(nodes.length / 10) * 140;
    
    const snapX = Math.round((baseX + offsetX) / gridSize) * gridSize;
    const snapY = Math.round((baseY + offsetY) / gridSize) * gridSize;
    
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: { x: snapX, y: snapY },
      style: { width: 200, height: 100 },
      data: { 
        content: 'New note...' 
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, nodes.length]);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        addNewNode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addNewNode]);

  // Função para atualizar uma edge (reconectar)
  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => els.map((el) => 
        el.id === oldEdge.id 
          ? { ...el, source: newConnection.source!, target: newConnection.target!, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle }
          : el
      ));
    },
    [setEdges],
  );

  // Função chamada quando usuário arrasta uma edge para fora - deleta a edge
  const onEdgeUpdateStart = useCallback(() => {
    // Podemos adicionar feedback visual aqui se quisermos
  }, []);

  const onEdgeUpdateEnd = useCallback(
    (event: MouseEvent | TouchEvent, edge: Edge) => {
      // Se o evento não tem target válido ou não é um handle, delete a edge
      const target = event.target as Element;
      const isHandle = target?.classList.contains('react-flow__handle') || 
                      target?.classList.contains('custom-handle') ||
                      target?.closest('.react-flow__handle') ||
                      target?.closest('.custom-handle');
      
      if (!isHandle) {
        // Remove a edge se não foi solta em um handle válido
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [setEdges],
  );

  if (isLoading) {
    return (
      <div className="canvas-loading">
        <div className="loading-spinner"></div>
        <div>Loading canvas...</div>
      </div>
    );
  }

  // Verificar se deve mostrar placeholder
  const shouldShowPlaceholder = !selectedFile || !selectedFile.endsWith('.canvas');

  if (shouldShowPlaceholder) {
    return (
      <ViewPlaceholder
        type="canvas"
        title="Canvas"
        description="Crie diagramas e mapas mentais conectando ideias visualmente."
        currentFile={selectedFile}
        expectedFileType=".canvas"
      />
    );
  }

  return (
    <div className="canvas-container" onContextMenu={(e) => e.preventDefault()}>
      <div className="canvas-header">
        <div className="canvas-title">
          {currentFile ? (
            <>
              <span className="file-name">
                {fileService.getFileNameWithoutExtension(currentFile)}
                {isSaving && <span className="save-indicator"> •</span>}
              </span>
              <span className="file-path">{currentFile}</span>
            </>
          ) : (
            <span className="no-file">Canvas</span>
          )}
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={true}
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
        className="canvas-flow"
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <CanvasToolbar onAddNode={addNewNode} />
        <Controls className="canvas-controls" />
        <MiniMap 
          className="canvas-minimap"
          nodeColor={() => 'var(--accent)'}
          position="bottom-right"
        />
        <Background 
          variant={BackgroundVariant.Lines} 
          gap={20} 
          size={1}
          className="canvas-background"
        />
      </ReactFlow>
    </div>
  );
};

const CanvasView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
};

export default CanvasView;
