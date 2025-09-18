import React, { useEffect, useRef } from 'react';
import { 
  Copy, 
  Scissors, 
  Clipboard, 
  Bold, 
  Italic, 
  Code, 
  Link, 
  Table, 
  FileText,
  Folder,
  FolderPlus,
  Trash2,
  Edit3,
  RefreshCw,
  Eye,
  Layout,
  GitBranch
} from 'lucide-react';
import './ContextMenu.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  action: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  visible: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  items, 
  position, 
  onClose, 
  visible 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Don't close if clicking on CodeMirror editor
        const target = event.target as Element;
        if (target && (
          target.closest('.cm-editor') || 
          target.closest('.cm-content') ||
          target.classList.contains('cm-editor') ||
          target.classList.contains('cm-content')
        )) {
          return;
        }
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust position if menu would go off screen
      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [visible, position]);

  if (!visible) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      // Close the menu first
      onClose();
      
      // Execute the action after a short delay to allow the menu to close
      setTimeout(() => {
        item.action();
        
        // Dispatch custom event to restore focus
        document.dispatchEvent(new CustomEvent('editor-focus-restore'));
      }, 0);
    }
  };

  return (
    <div className="context-menu-overlay">
      <div 
        ref={menuRef}
        className="context-menu"
        style={{ left: position.x, top: position.y }}
      >
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {item.separator ? (
              <div className="context-menu-separator" />
            ) : (
              <button
                className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span className="context-menu-icon">
                    {item.icon}
                  </span>
                )}
                <span className="context-menu-label">{item.label}</span>
                {item.shortcut && (
                  <span className="context-menu-shortcut">{item.shortcut}</span>
                )}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Predefined context menu configurations
export const createEditorContextMenu = (
  hasSelection: boolean,
  selectedText: string,
  onAction: (action: string, data?: any) => void
): ContextMenuItem[] => [
  {
    id: 'cut',
    label: 'Cut',
    icon: <Scissors size={16} />,
    shortcut: 'Ctrl+X',
    disabled: !hasSelection,
    action: () => onAction('cut', selectedText)
  },
  {
    id: 'copy',
    label: 'Copy',
    icon: <Copy size={16} />,
    shortcut: 'Ctrl+C',
    disabled: !hasSelection,
    action: () => onAction('copy', selectedText)
  },
  {
    id: 'paste',
    label: 'Paste',
    icon: <Clipboard size={16} />,
    shortcut: 'Ctrl+V',
    action: () => onAction('paste')
  },
  { id: 'separator-1', label: '', separator: true, action: () => {} },
  {
    id: 'bold',
    label: 'Bold',
    icon: <Bold size={16} />,
    shortcut: 'Ctrl+B',
    action: () => onAction('bold')
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: <Italic size={16} />,
    shortcut: 'Ctrl+I',
    action: () => onAction('italic')
  },
  {
    id: 'code',
    label: 'Inline Code',
    icon: <Code size={16} />,
    shortcut: 'Ctrl+`',
    action: () => onAction('code')
  },
  { id: 'separator-2', label: '', separator: true, action: () => {} },
  {
    id: 'link',
    label: 'Insert Link',
    icon: <Link size={16} />,
    shortcut: 'Ctrl+K',
    action: () => onAction('link')
  },
  {
    id: 'table',
    label: 'Insert Table',
    icon: <Table size={16} />,
    action: () => onAction('table')
  }
];

export const createFileContextMenu = (
  filePath: string,
  isDirectory: boolean,
  onAction: (action: string, data?: any) => void
): ContextMenuItem[] => [
  {
    id: 'open',
    label: isDirectory ? 'Open Folder' : 'Open File',
    icon: isDirectory ? <Folder size={16} /> : <FileText size={16} />,
    action: () => onAction('open', filePath)
  },
  { id: 'separator-1', label: '', separator: true, action: () => {} },
  {
    id: 'rename',
    label: 'Rename',
    icon: <Edit3 size={16} />,
    shortcut: 'F2',
    action: () => onAction('rename', filePath)
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 size={16} />,
    shortcut: 'Del',
    action: () => onAction('delete', filePath)
  },
  { id: 'separator-2', label: '', separator: true, action: () => {} },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: <RefreshCw size={16} />,
    shortcut: 'F5',
    action: () => onAction('refresh', filePath)
  }
];

export const createPreviewContextMenu = (
  onAction: (action: string, data?: any) => void
): ContextMenuItem[] => [
  {
    id: 'copy-html',
    label: 'Copy as HTML',
    icon: <Copy size={16} />,
    action: () => onAction('copy-html')
  },
  {
    id: 'print',
    label: 'Print',
    icon: <FileText size={16} />,
    shortcut: 'Ctrl+P',
    action: () => onAction('print')
  },
  { id: 'separator-1', label: '', separator: true, action: () => {} },
  {
    id: 'scroll-sync',
    label: 'Toggle Scroll Sync',
    icon: <RefreshCw size={16} />,
    action: () => onAction('scroll-sync')
  },
  {
    id: 'zen-mode',
    label: 'Focus Mode',
    icon: <Eye size={16} />,
    action: () => onAction('zen-mode')
  }
];

export const createFolderContainerContextMenu = (
  rootPath: string,
  onAction: (action: string, data?: any) => void
): ContextMenuItem[] => [
  {
    id: 'new-markdown',
    label: 'New Markdown File',
    icon: <FileText size={16} />,
    action: () => onAction('new-markdown', rootPath)
  },
  {
    id: 'new-kanban',
    label: 'New Kanban Board',
    icon: <Layout size={16} />,
    action: () => onAction('new-kanban', rootPath)
  },
  {
    id: 'new-canvas',
    label: 'New Canvas',
    icon: <GitBranch size={16} />,
    action: () => onAction('new-canvas', rootPath)
  },
  { id: 'separator-1', label: '', separator: true, action: () => {} },
  {
    id: 'new-folder',
    label: 'New Folder', 
    icon: <FolderPlus size={16} />,
    action: () => onAction('new-folder', rootPath)
  },
  { id: 'separator-2', label: '', separator: true, action: () => {} },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: <RefreshCw size={16} />,
    shortcut: 'F5',
    action: () => onAction('refresh', rootPath)
  },
  { id: 'separator-3', label: '', separator: true, action: () => {} },
  {
    id: 'select-folder',
    label: 'Change Root Folder',
    icon: <Folder size={16} />,
    action: () => onAction('select-folder')
  }
];

export default ContextMenu;
