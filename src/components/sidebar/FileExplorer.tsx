import React, { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, File, FileText, Layout, GitBranch } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useFileWatcher } from '../../hooks/useFileWatcher';
import { usePopup } from '../../contexts/PopupContext';
import ContextMenu, { createFileContextMenu, createFolderContainerContextMenu } from '../common/ContextMenu';
import TemplateModal from '../modals/TemplateModal';
import { Template } from '../../services/TemplateService';
import FileService from '../../services/FileService';
import { useAppStore } from '../../stores/appStore';
import { AppView } from '../../types/app';
import './FileExplorer.css';

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  onFileSelect, 
  selectedFile 
}) => {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<'markdown' | 'kanban' | 'canvas'>('markdown');
  const [createModalPath, setCreateModalPath] = useState<string>('');
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const { showAlert, showConfirm, showInput } = usePopup();
  const { setCurrentFolder, switchToView, setSelectedFile } = useAppStore();

  // Load saved path from localStorage on mount
  useEffect(() => {
    const savedPath = localStorage.getItem('fileExplorer-rootPath');
    if (savedPath) {
      setRootPath(savedPath);
      setCurrentFolder(savedPath); // Definir pasta atual no store
      loadTree(savedPath);
    }
  }, [setCurrentFolder]);

  const selectRootFolder = async () => {
    try {
      showInput(
        'Selecionar Pasta',
        'Digite o caminho da pasta raiz:',
        (path: string) => {
          setRootPath(path);
          setCurrentFolder(path); // Atualizar pasta atual no store
          localStorage.setItem('fileExplorer-rootPath', path);
          setExpandedFolders(new Set([path]));
          loadTree(path);
        },
        { 
          placeholder: 'Ex: C:\\Users\\YourName\\Documents',
          defaultValue: rootPath || ''
        }
      );
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const loadTree = async (dirPath: string) => {
    setIsLoading(true);
    try {
      const result = await invoke<FileNode[]>('read_dir_tree', { path: dirPath });
      setTree(result);
    } catch (error) {
      console.error('Error loading file tree:', error);
      setTree([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTree = useCallback(() => {
    if (rootPath) {
      loadTree(rootPath);
    }
  }, [rootPath]);

  // File watcher callbacks
  const handleFileCreated = useCallback((filePath: string) => {
    console.log('File created:', filePath);
    refreshTree();
  }, [refreshTree]);

  const handleFileDeleted = useCallback((filePath: string) => {
    console.log('File deleted:', filePath);
    refreshTree();
    // If the deleted file was selected, clear selection
    setSelectedFile(null);
  }, [refreshTree, setSelectedFile]);

  const handleFileChanged = useCallback((filePath: string) => {
    console.log('File changed:', filePath);
    // For file changes, we might not need to refresh the entire tree
    // but we could update file metadata if needed
  }, []);

  const handleFileRenamed = useCallback((oldPath: string, newPath: string) => {
    console.log('File renamed:', oldPath, '->', newPath);
    refreshTree();
    // If the renamed file was selected, clear selection
    setSelectedFile(null);
  }, [refreshTree, setSelectedFile]);

  // Initialize file watcher for current root path
  useFileWatcher(rootPath, {
    enabled: !!rootPath,
    onFileCreated: handleFileCreated,
    onFileDeleted: handleFileDeleted,
    onFileChanged: handleFileChanged,
    onFileRenamed: handleFileRenamed,
  });

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (filePath: string, isDir: boolean) => {
    if (isDir) {
      toggleFolder(filePath);
    } else {
      // Detectar tipo de arquivo e navegar automaticamente
      const fileService = FileService.getInstance();
      const fileType = fileService.getFileType(filePath);
      
      // Verificar se é um tipo de arquivo suportado
      if (fileType === 'unknown') {
        console.warn('Unsupported file type:', filePath);
        return; // Não permite clique em arquivos não suportados
      }
      
      // Definir o arquivo selecionado
      setSelectedFile(filePath);
      onFileSelect?.(filePath);
      
      // Navegar automaticamente para a view apropriada e salvar sessão
      const { switchToView, setViewSession } = useAppStore.getState();
      let targetView: AppView;
      
      switch (fileType) {
        case 'markdown':
          targetView = AppView.EDITOR;
          break;
        case 'kanban':
          targetView = AppView.KANBAN;
          break;
        case 'canvas':
          targetView = AppView.CANVAS;
          break;
        default:
          return;
      }
      
      // Salvar o arquivo na sessão da view correspondente
      setViewSession(targetView, filePath);
      
      // Navegar para a view
      switchToView(targetView);
    }
  };

  const handleCreateFromTemplate = async (template: Template, fileName: string) => {
    try {
      const fileService = FileService.getInstance();
      const targetPath = createModalPath || rootPath;
      
      if (!targetPath) {
        showAlert('Error', 'No target path available for file creation.', 'error');
        return;
      }

      const fullFileName = fileService.generateFileName(fileName, template.type);
      const filePath = `${targetPath}/${fullFileName}`;
      
      // Criar o arquivo baseado no tipo
      switch (template.type) {
        case 'markdown':
          await fileService.saveMarkdownFile(filePath, template.content as string);
          break;
        case 'kanban':
          await fileService.createKanbanFile(filePath, template.content as any);
          break;
        case 'canvas':
          await fileService.createCanvasFile(filePath, template.content as any);
          break;
      }

      // Refresh tree and select the new file
      await refreshTree();
      setSelectedFile(filePath);
      onFileSelect?.(filePath);
      
      // Navigate to appropriate view and save session
      const { setViewSession } = useAppStore.getState();
      let targetView: AppView;
      
      switch (template.type) {
        case 'markdown':
          targetView = AppView.EDITOR;
          break;
        case 'kanban':
          targetView = AppView.KANBAN;
          break;
        case 'canvas':
          targetView = AppView.CANVAS;
          break;
        default:
          return;
      }
      
      // Salvar o arquivo na sessão da view correspondente
      setViewSession(targetView, filePath);
      
      // Navegar para a view
      switchToView(targetView);

      showAlert('Success', `File "${fullFileName}" created successfully!`, 'success');
    } catch (error) {
      console.error('Error creating file:', error);
      showAlert('Error', `Failed to create file: ${error}`, 'error');
    }
  };

  const handleFileAction = useCallback(async (action: string, data?: any) => {
    const filePath = data;
    
    switch (action) {
      case 'open':
        if (filePath) {
          const isDir = tree.some(node => node.path === filePath && node.is_dir);
          handleFileClick(filePath, isDir);
        }
        break;
      case 'new-file':
        await handleCreateFile(filePath);
        break;
      case 'new-markdown':
        // Trigger template modal for markdown files
        setShowCreateModal(true);
        setCreateModalType('markdown');
        setCreateModalPath(filePath || rootPath || '');
        break;
      case 'new-kanban':
        // Trigger template modal for kanban boards
        setShowCreateModal(true);
        setCreateModalType('kanban');
        setCreateModalPath(filePath || rootPath || '');
        break;
      case 'new-canvas':
        // Trigger template modal for canvas files
        setShowCreateModal(true);
        setCreateModalType('canvas');
        setCreateModalPath(filePath || rootPath || '');
        break;
      case 'new-folder':
        await handleCreateFolder(filePath);
        break;
      case 'delete':
        await handleDeleteFile(filePath);
        break;
      case 'rename':
        await handleRenameFile(filePath);
        break;
      case 'refresh':
        refreshTree();
        break;
      case 'select-folder':
        selectRootFolder();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [tree]);

  const handleContextMenu = (e: React.MouseEvent, filePath: string, isDir: boolean) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent container context menu from showing
    
    const menuItems = createFileContextMenu(filePath, isDir, handleFileAction);
    showContextMenu(e, menuItems);
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only show context menu if we have a root path (folder selected)
    if (!rootPath) return;
    
    const menuItems = createFolderContainerContextMenu(rootPath, handleFileAction);
    showContextMenu(e, menuItems);
  };

  const handleCreateFile = async (folderPath: string) => {
    showInput(
      'Criar Novo Arquivo',
      'Digite o nome do arquivo (com extensão .md):',
      async (fileName: string) => {
        try {
          await invoke('create_md_file', {
            dirPath: folderPath,
            fileName: fileName.trim()
          });
          refreshTree();
        } catch (error) {
          console.error('Error creating file:', error);
          showAlert('Erro', 'Erro ao criar arquivo: ' + error, 'error');
        }
      },
      { placeholder: 'Ex: meu-arquivo.md' }
    );
  };

  const handleCreateFolder = async (folderPath: string) => {
    showInput(
      'Criar Nova Pasta',
      'Digite o nome da nova pasta:',
      async (folderName: string) => {
        try {
          await invoke('create_folder', {
            dirPath: folderPath,
            folderName: folderName.trim()
          });
          refreshTree();
        } catch (error) {
          console.error('Error creating folder:', error);
          showAlert('Erro', 'Erro ao criar pasta: ' + error, 'error');
        }
      },
      { placeholder: 'Ex: minha-pasta' }
    );
  };

  const handleRenameFile = async (filePath: string) => {
    const currentName = filePath.split(/[/\\]/).pop() || '';
    const currentNameWithoutExt = currentName.replace(/\.[^/.]+$/, "");
    
    showInput(
      'Renomear Arquivo',
      'Digite o novo nome do arquivo:',
      async (newName: string) => {
        try {
          const trimmedName = newName.trim();
          if (!trimmedName) {
            showAlert('Erro', 'Nome do arquivo não pode estar vazio.', 'error');
            return;
          }

          // Manter a extensão original
          const extension = currentName.includes('.') ? '.' + currentName.split('.').pop() : '';
          const newFileName = trimmedName + extension;

          const newPath = await invoke<string>('rename_file', {
            oldPath: filePath,
            newName: newFileName
          });

          // Atualizar o arquivo selecionado se for o que está sendo renomeado
          if (selectedFile === filePath) {
            onFileSelect?.(newPath);
          }

          refreshTree();
          showAlert('Sucesso', `Arquivo renomeado para "${newFileName}"`, 'success');
        } catch (error) {
          console.error('Error renaming file:', error);
          showAlert('Erro', 'Erro ao renomear arquivo: ' + error, 'error');
        }
      },
      { 
        placeholder: 'Ex: novo-nome',
        defaultValue: currentNameWithoutExt
      }
    );
  };

  const handleDeleteFile = async (filePath: string) => {
    const fileName = filePath.split(/[/\\]/).pop() || 'este item';
    showConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar "${fileName}"?`,
      async () => {
        try {
          await invoke('delete_file', { filePath: filePath });
          
          // Verificar se o arquivo deletado é o arquivo atualmente selecionado
          const { selectedFile, setSelectedFile, viewSessions, setViewSession } = useAppStore.getState();
          if (selectedFile === filePath) {
            // Limpar a seleção para voltar ao estado inicial (placeholder)
            setSelectedFile(null);
          }
          
          // Limpar o arquivo das sessões de view se estiver presente
          Object.entries(viewSessions).forEach(([view, sessionFile]) => {
            if (sessionFile === filePath) {
              setViewSession(view as AppView, null);
            }
          });
          
          refreshTree();
        } catch (error) {
          console.error('Error deleting file:', error);
          showAlert('Erro', 'Erro ao deletar: ' + error, 'error');
        }
      }
    );
  };

  const getFileIcon = (fileName: string) => {
    const fileService = FileService.getInstance();
    const fileType = fileService.getFileType(fileName);
    
    switch (fileType) {
      case 'markdown':
        return <FileText size={16} />;
      case 'kanban':
        return <Layout size={16} />;
      case 'canvas':
        return <GitBranch size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const getFileTag = (fileName: string) => {
    const fileService = FileService.getInstance();
    const fileType = fileService.getFileType(fileName);
    
    switch (fileType) {
      case 'markdown':
        return { label: 'MD', color: '#0066cc' };
      case 'kanban':
        return { label: 'KANBAN', color: '#28a745' };
      case 'canvas':
        return { label: 'CANVAS', color: '#6f42c1' };
      default:
        return null;
    }
  };

  const getDisplayName = (fileName: string) => {
    const fileService = FileService.getInstance();
    const fileType = fileService.getFileType(fileName);
    
    if (fileType !== 'unknown') {
      // Remove a extensão para arquivos suportados
      return fileService.getFileNameWithoutExtension(fileName);
    }
    
    return fileName; // Mantém nome completo para arquivos não suportados
  };

  const isFileSupported = (fileName: string) => {
    const fileService = FileService.getInstance();
    const fileType = fileService.getFileType(fileName);
    return fileType !== 'unknown';
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const isSupported = node.is_dir || isFileSupported(node.name);
    const fileTag = node.is_dir ? null : getFileTag(node.name);
    const displayName = node.is_dir ? node.name : getDisplayName(node.name);

    return (
      <div key={node.path} className="file-node">
        <div
          className={`file-item ${isSelected ? 'selected' : ''} ${!isSupported ? 'unsupported' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => isSupported ? handleFileClick(node.path, node.is_dir) : undefined}
          onContextMenu={(e) => handleContextMenu(e, node.path, node.is_dir)}
          title={!isSupported ? 'Tipo de arquivo não suportado' : undefined}
        >
          <div className="file-icon">
            {node.is_dir ? (
              isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
            ) : (
              getFileIcon(node.name)
            )}
          </div>
          <span className="file-name">{displayName}</span>
          {fileTag && (
            <span 
              className="file-tag" 
              style={{ backgroundColor: fileTag.color }}
            >
              {fileTag.label}
            </span>
          )}
        </div>

        {node.is_dir && isExpanded && node.children && (
          <div className="file-children">
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Explorer</h3>
        <button className="select-folder-btn" onClick={selectRootFolder}>
          <Folder size={16} />
          {rootPath ? 'Trocar Pasta' : 'Selecionar Pasta'}
        </button>
      </div>

      <div className="file-explorer-content" onContextMenu={handleContainerContextMenu}>
        {isLoading ? (
          <div className="loading">Carregando...</div>
        ) : rootPath ? (
          tree.length > 0 ? (
            <div className="file-tree">
              {tree.map((node) => renderFileNode(node))}
            </div>
          ) : (
            <div className="empty-state">Pasta vazia</div>
          )
        ) : (
          <div className="empty-state">
            Selecione uma pasta para começar
          </div>
        )}
      </div>

      <ContextMenu
        items={contextMenu.items}
        position={contextMenu.position}
        visible={contextMenu.visible}
        onClose={hideContextMenu}
      />

      <TemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelectTemplate={handleCreateFromTemplate}
        defaultType={createModalType}
      />
    </div>
  );
};

export default FileExplorer;
