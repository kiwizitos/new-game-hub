import { create } from 'zustand';
import { AppView } from '../types/app';

const fileView = (file: string | null): AppView | null => {
  const extension = file?.split('.').pop()?.toLowerCase();
  if (extension === 'md' || extension === 'markdown') return AppView.EDITOR;
  if (extension === 'kanban') return AppView.KANBAN;
  if (extension === 'canvas') return AppView.CANVAS;
  return null;
};

interface AppStore {
  currentView: AppView;
  sidebarVisible: boolean;
  selectedFile: string | null;
  currentFolder: string | null; // Pasta atualmente selecionada no explorer
  
  // Session per view - mantém o último arquivo ativo para cada view
  viewSessions: {
    [AppView.EDITOR]: string | null;
    [AppView.KANBAN]: string | null;
    [AppView.CANVAS]: string | null;
    [AppView.HOME]: null;
  };
  
  // Actions
  setCurrentView: (view: AppView) => void;
  setSidebarVisible: (visible: boolean) => void;
  setSelectedFile: (file: string | null) => void;
  setCurrentFolder: (folder: string | null) => void;
  setViewSession: (view: AppView, file: string | null) => void;
  toggleSidebar: () => void;
  switchToView: (view: AppView) => void;
  loadPreferences: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentView: AppView.HOME,
  sidebarVisible: true,
  selectedFile: null,
  currentFolder: null,
  
  viewSessions: {
    [AppView.EDITOR]: null,
    [AppView.KANBAN]: null,
    [AppView.CANVAS]: null,
    [AppView.HOME]: null,
  },

  setCurrentView: (view) => {
    set({ currentView: view });
    localStorage.setItem('game-hub-current-view', view);
  },

  setSidebarVisible: (visible) => {
    set({ sidebarVisible: visible });
    localStorage.setItem('game-hub-sidebar-visible', visible.toString());
  },

  setSelectedFile: (file) => {
    const view = fileView(file);
    if (view) get().setViewSession(view, file);
    if (!file && get().selectedFile) {
      const previousView = fileView(get().selectedFile);
      if (previousView) get().setViewSession(previousView, null);
    }
    set({ selectedFile: file });
    if (file) {
      localStorage.setItem('game-hub-selected-file', file);
    } else {
      localStorage.removeItem('game-hub-selected-file');
    }
  },

  setCurrentFolder: (folder) => {
    set({ currentFolder: folder });
    if (folder) {
      localStorage.setItem('game-hub-current-folder', folder);
    } else {
      localStorage.removeItem('game-hub-current-folder');
    }
  },

  setViewSession: (view, file) => {
    set((state) => ({
      viewSessions: {
        ...state.viewSessions,
        [view]: file
      }
    }));
    // Salvar as sessões no localStorage
    const sessions = JSON.stringify(get().viewSessions);
    localStorage.setItem('game-hub-view-sessions', sessions);
  },

  toggleSidebar: () => {
    const { sidebarVisible } = get();
    const newValue = !sidebarVisible;
    set({ sidebarVisible: newValue });
    localStorage.setItem('game-hub-sidebar-visible', newValue.toString());
  },

  switchToView: (view) => {
    const selectedFile = get().viewSessions[view] || null;
    set({ currentView: view, selectedFile });
    localStorage.setItem('game-hub-current-view', view);
    if (selectedFile) {
      localStorage.setItem('game-hub-selected-file', selectedFile);
    } else {
      localStorage.removeItem('game-hub-selected-file');
    }
  },

  loadPreferences: () => {
    const savedView = localStorage.getItem('game-hub-current-view') as AppView;
    const savedSidebar = localStorage.getItem('game-hub-sidebar-visible');
    const savedFile = localStorage.getItem('game-hub-selected-file');
    const savedSessions = localStorage.getItem('game-hub-view-sessions');

    if (savedView && Object.values(AppView).includes(savedView)) {
      set({ currentView: savedView });
    }

    if (savedSidebar !== null) {
      set({ sidebarVisible: savedSidebar === 'true' });
    }

    // Carregar sessões por view
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        if (sessions && typeof sessions === 'object') {
          for (const view of [AppView.EDITOR, AppView.KANBAN, AppView.CANVAS]) {
            const file = sessions[view];
            get().setViewSession(view, typeof file === 'string' && fileView(file) === view ? file : null);
          }
        }
      } catch (error) {
        console.warn('Failed to parse view sessions from localStorage:', error);
      }
    }
    if (!savedSessions && savedFile && fileView(savedFile)) {
      get().setViewSession(fileView(savedFile)!, savedFile);
    }
    set({ currentFolder: localStorage.getItem('game-hub-current-folder') });
    get().switchToView(get().currentView);
  },
}));
