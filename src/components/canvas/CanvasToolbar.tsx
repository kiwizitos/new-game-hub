import React, { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import './CanvasToolbar.css';

interface CanvasToolbarProps {
  onAddNode: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onAddNode }) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-section">
        <button 
          className="toolbar-btn primary"
          onClick={onAddNode}
          title="Add New Node (Ctrl+N)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Node
        </button>
      </div>
      
      <div className="toolbar-section">
        <button 
          className="toolbar-btn"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="21 21l-4.35-4.35"></path>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="21 21l-4.35-4.35"></path>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={handleFitView}
          title="Fit View"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CanvasToolbar;
