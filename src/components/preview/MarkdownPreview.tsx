import React, { useMemo } from 'react';
import { marked } from 'marked';
import { useContextMenu } from '../../hooks/useContextMenu';
import ContextMenu, { createPreviewContextMenu } from '../common/ContextMenu';
import './MarkdownPreview.css';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  content, 
  className = '' 
}) => {
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  const htmlContent = useMemo(() => {
    // Configure marked options for better rendering
    marked.setOptions({
      breaks: true,
      gfm: true, // GitHub Flavored Markdown
    });

    try {
      return marked(content || '');
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return '<p>Error parsing markdown content</p>';
    }
  }, [content]);

  const handlePreviewAction = async (action: string) => {
    switch (action) {
      case 'copy-html':
        try {
          const html = await htmlContent;
          navigator.clipboard.writeText(html);
        } catch (error) {
          console.error('Failed to copy HTML:', error);
        }
        break;
      case 'print':
        window.print();
        break;
      case 'scroll-sync':
        // TODO: Implement scroll sync
        console.log('Scroll sync not implemented yet');
        break;
      case 'zen-mode':
        // TODO: Implement zen mode
        console.log('Zen mode not implemented yet');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuItems = createPreviewContextMenu(handlePreviewAction);
    showContextMenu(e, menuItems);
  };

  return (
    <div className={`markdown-preview ${className}`} onContextMenu={handleContextMenu}>
      <div 
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      <ContextMenu
        items={contextMenu.items}
        position={contextMenu.position}
        visible={contextMenu.visible}
        onClose={hideContextMenu}
      />
    </div>
  );
};

export default MarkdownPreview;
