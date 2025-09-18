import { create } from 'zustand';
import { AppView } from '../types/app';

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
    set({ selectedFile: file });
    if (file) {
      localStorage.setItem('game-hub-selected-file', file);
    }
  },

  setCurrentFolder: (folder) => {
    set({ currentFolder: folder });
    if (folder) {
      localStorage.setItem('game-hub-current-folder', folder);
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
    set({ currentView: view });
    localStorage.setItem('game-hub-current-view', view);
    
    // Restaurar o último arquivo para esta view, se houver
    const { viewSessions } = get();
    const sessionFile = viewSessions[view];
    if (sessionFile && view !== AppView.HOME) {
      set({ selectedFile: sessionFile });
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

    if (savedFile) {
      set({ selectedFile: savedFile });
    }

    // Carregar sessões por view
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        set({ viewSessions: sessions });
      } catch (error) {
        console.warn('Failed to parse view sessions from localStorage:', error);
      }
    }
  },
}));
