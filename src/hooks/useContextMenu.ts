import { useState, useCallback } from 'react';

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    separator?: boolean;
    disabled?: boolean;
    action: () => void;
  }>;
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    items: []
  });

  const showContextMenu = useCallback((
    event: React.MouseEvent | MouseEvent,
    items: ContextMenuState['items']
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      items
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ 
      ...prev, 
      visible: false 
    }));
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  };
};
