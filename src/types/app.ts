export enum AppView {
  HOME = 'home',
  EDITOR = 'editor',
  KANBAN = 'kanban',
  CANVAS = 'canvas'
}

export interface ViewConfig {
  id: AppView;
  title: string;
  icon: string;
  component: () => JSX.Element;
}

export interface AppState {
  currentView: AppView;
  sidebarVisible: boolean;
  selectedFile: string | null;
  isDarkMode: boolean;
}
