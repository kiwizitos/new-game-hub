import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Eye, EyeOff, Split } from 'lucide-react';
import MarkdownEditor from '../editor/MarkdownEditor';
import MarkdownPreview from '../preview/MarkdownPreview';
import ViewPlaceholder from '../common/ViewPlaceholder';
import { useAppStore } from '../../stores/appStore';
import { usePopup } from '../../contexts/PopupContext';
import FileService from '../../services/FileService';
import './EditorLayout.css';

type ViewMode = 'editor' | 'preview' | 'split';

const EditorLayout: React.FC = () => {
  const { selectedFile } = useAppStore();
  const { showAlert } = usePopup();
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const fileService = new FileService();

  // Load file content when selectedFile changes
  useEffect(() => {
    if (!selectedFile) {
      setFileContent('');
      setHasUnsavedChanges(false);
      return;
    }

    // Verificar se é um arquivo .md ou .markdown
    if (!selectedFile.toLowerCase().endsWith('.md') && !selectedFile.toLowerCase().endsWith('.markdown')) {
      return;
    }

    loadFileContent(selectedFile);
  }, [selectedFile]);

  const loadFileContent = async (filePath: string) => {
    setIsLoading(true);
    try {
      const content = await invoke<string>('read_file_content', { filePath: filePath });
      setFileContent(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading file:', error);
      
      // Verificar se o erro é de arquivo não encontrado
      const errorMessage = String(error);
      if (errorMessage.includes('não pode encontrar o arquivo') || 
          errorMessage.includes('No such file') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('os error 2')) {
        // Arquivo foi deletado - limpar seleção para voltar ao placeholder
        const { setSelectedFile } = useAppStore.getState();
        setSelectedFile(null);
        setFileContent('');
      } else {
        // Outro tipo de erro - mostrar mensagem de erro
        setFileContent(`# Error loading file\n\nCould not load: ${filePath}\n\nError: ${error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setFileContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedFile || !hasUnsavedChanges) return;

    try {
      await invoke('write_file_content', { 
        filePath: selectedFile, 
        content: fileContent 
      });
      setHasUnsavedChanges(false);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      showAlert('Erro', 'Erro ao salvar arquivo: ' + error, 'error');
    }
  };

  const handleContextMenu = (e: MouseEvent, selectedText: string) => {
    e.preventDefault();
    console.log('Context menu requested with selected text:', selectedText);
  };

  // Verificar se deve mostrar placeholder
  const shouldShowPlaceholder = !selectedFile || 
    (!selectedFile.toLowerCase().endsWith('.md') && !selectedFile.toLowerCase().endsWith('.markdown'));

  if (shouldShowPlaceholder) {
    return (
      <ViewPlaceholder
        type="editor"
        title="Editor de Markdown"
        description="Edite documentos Markdown com preview em tempo real e sintaxe destacada."
        currentFile={selectedFile}
        expectedFileType=".md/.markdown"
      />
    );
  }

  return (
    <div className="editor-layout">
      <div className="editor-main">
        <div className="editor-header">
          <div className="editor-title">
            {selectedFile ? (
              <>
                <span className="file-name">
                  {fileService.getFileNameWithoutExtension(selectedFile)}
                  {hasUnsavedChanges && <span className="unsaved-indicator"> •</span>}
                </span>
                <span className="file-path">{selectedFile}</span>
              </>
            ) : (
              <span className="no-file">No file selected</span>
            )}
          </div>
          
          <div className="editor-actions">
            <div className="view-mode-controls">
              <button
                className={`btn view-mode-btn ${viewMode === 'editor' ? 'active' : ''}`}
                onClick={() => setViewMode('editor')}
                title="Editor Only"
              >
                <Eye size={16} />
              </button>
              <button
                className={`btn view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Split View"
              >
                <Split size={16} />
              </button>
              <button
                className={`btn view-mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
                title="Preview Only"
              >
                <EyeOff size={16} />
              </button>
            </div>
            
            {selectedFile && hasUnsavedChanges && (
              <button 
                className="btn btn-primary save-btn"
                onClick={handleSave}
                title="Save (Ctrl+S)"
              >
                Save
              </button>
            )}
          </div>
        </div>

        <div className="editor-content">
          {isLoading ? (
            <div className="editor-loading">
              <div className="loading-spinner"></div>
              <span>Loading file...</span>
            </div>
          ) : selectedFile ? (
            <div className={`editor-workspace ${viewMode}`}>
              {(viewMode === 'editor' || viewMode === 'split') && (
                <div className="editor-pane">
                  <MarkdownEditor
                    content={fileContent}
                    onContentChange={handleContentChange}
                    onSave={handleSave}
                    onContextMenu={handleContextMenu}
                  />
                </div>
              )}
              
              {viewMode === 'split' && <div className="editor-divider"></div>}
              
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="preview-pane">
                  <MarkdownPreview content={fileContent} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
