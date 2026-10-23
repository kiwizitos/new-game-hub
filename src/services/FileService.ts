import { invoke } from '@tauri-apps/api/core';
import { KanbanData } from '../types/kanban';
import type { CanvasCardTemplate, CanvasNodeData } from '../types/canvas';
import { parseCanvasData, parseKanbanData } from './fileValidation';

export interface FileMetadata {
  name: string;
  path: string;
  type: 'markdown' | 'kanban' | 'canvas';
  lastModified: Date;
  size: number;
}

export interface CanvasData {
  title: string;
  cardTemplates?: CanvasCardTemplate[];
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    style: { width: number; height: number };
    data: CanvasNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

class FileService {
  private static instance: FileService;
  private pendingWrites = new Map<string, Promise<void>>();

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  private fileKey(path: string): string {
    return path.replace(/\\/g, '/');
  }

  private async writeContent(filePath: string, content: string): Promise<void> {
    const key = this.fileKey(filePath);
    const previous = this.pendingWrites.get(key);
    const write = () => invoke<void>('write_file_content', { filePath, content });
    // A new editor may mount while the previous editor is still flushing this file.
    const pending = previous ? previous.then(write, write) : write();
    this.pendingWrites.set(key, pending);
    try {
      await pending;
    } finally {
      if (this.pendingWrites.get(key) === pending) this.pendingWrites.delete(key);
    }
  }

  private async readContent(filePath: string): Promise<string> {
    const key = this.fileKey(filePath);
    while (this.pendingWrites.has(key)) await this.pendingWrites.get(key);
    return invoke<string>('read_file_content', { filePath });
  }

  // Detectar tipo de arquivo pela extensão
  getFileType(filename: string): 'markdown' | 'kanban' | 'canvas' | 'unknown' {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'kanban':
        return 'kanban';
      case 'canvas':
        return 'canvas';
      default:
        return 'unknown';
    }
  }

  // Criar arquivo Kanban
  async createKanbanFile(path: string, data: KanbanData): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await this.writeContent(path.endsWith('.kanban') ? path : `${path}.kanban`, content);
    } catch (error) {
      console.error('Error creating kanban file:', error);
      throw error;
    }
  }

  // Carregar arquivo Kanban
  async loadKanbanFile(path: string): Promise<KanbanData> {
    try {
      const content = await this.readContent(path);
      return parseKanbanData(JSON.parse(content));
    } catch (error) {
      console.error('Error loading kanban file:', error);
      throw error;
    }
  }

  // Criar arquivo Canvas
  async createCanvasFile(path: string, data: CanvasData): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await this.writeContent(path.endsWith('.canvas') ? path : `${path}.canvas`, content);
    } catch (error) {
      console.error('Error creating canvas file:', error);
      throw error;
    }
  }

  // Carregar arquivo Canvas
  async loadCanvasFile(path: string): Promise<CanvasData> {
    try {
      const content = await this.readContent(path);
      return parseCanvasData(JSON.parse(content));
    } catch (error) {
      console.error('Error loading canvas file:', error);
      throw error;
    }
  }

  // Salvar arquivo Markdown
  async saveMarkdownFile(path: string, content: string): Promise<void> {
    try {
      await this.writeContent(path.endsWith('.md') ? path : `${path}.md`, content);
    } catch (error) {
      console.error('Error saving markdown file:', error);
      throw error;
    }
  }

  // Carregar arquivo Markdown
  async loadMarkdownFile(path: string): Promise<string> {
    try {
      return await this.readContent(path);
    } catch (error) {
      console.error('Error loading markdown file:', error);
      throw error;
    }
  }

  // Gerar nome de arquivo único
  generateFileName(baseName: string, type: 'markdown' | 'kanban' | 'canvas'): string {
    const extensions = {
      markdown: 'md',
      kanban: 'kanban',
      canvas: 'canvas'
    };
    
    // Verificar se o nome base está vazio ou é um nome genérico padrão
    const isGenericName = !baseName || 
                         baseName.trim() === '' || 
                         baseName === 'Untitled' ||
                         baseName === 'New Document' ||
                         baseName === 'New File';
    
    if (isGenericName) {
      // Adicionar timestamp apenas para nomes genéricos/vazios
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultNames = {
        markdown: 'document',
        kanban: 'board',
        canvas: 'canvas'
      };
      return `${defaultNames[type]}_${timestamp}.${extensions[type]}`;
    } else {
      // Usar o nome fornecido diretamente
      return `${baseName.trim()}.${extensions[type]}`;
    }
  }

  // Obter ícone para tipo de arquivo
  getFileIcon(type: string): string {
    switch (type) {
      case 'markdown':
        return '📝';
      case 'kanban':
        return '📋';
      case 'canvas':
        return '🎨';
      default:
        return '📄';
    }
  }

  // Obter cor para tipo de arquivo
  getFileColor(type: string): string {
    switch (type) {
      case 'markdown':
        return '#0066cc';
      case 'kanban':
        return '#28a745';
      case 'canvas':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  }

  // Obter nome do arquivo sem extensão
  getFileNameWithoutExtension(filePath: string): string {
    const fileName = filePath.split(/[\\/]/).pop() || '';
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
  }

  // Obter metadados do arquivo
  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
      const metadata = await invoke<{
        name: string;
        path: string;
        size: number;
        last_modified: number;
        is_dir: boolean;
      }>('get_file_metadata', { filePath });

      const fileType = this.getFileType(metadata.name);
      if (fileType === 'unknown') {
        throw new Error('Unsupported file type');
      }

      return {
        name: metadata.name,
        path: metadata.path,
        type: fileType,
        lastModified: new Date(metadata.last_modified),
        size: metadata.size,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // Formatar tamanho do arquivo para exibição
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Formatar data de modificação
  formatLastModified(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export default FileService;
