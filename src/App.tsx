import React, { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { PopupProvider } from './contexts/PopupContext';
import { useAppStore } from './stores/appStore';
import Navigation from './components/navigation/Navigation';
import MainLayout from './components/layout/MainLayout';
import HomeView from './components/views/HomeView';
import EditorLayout from './components/layout/EditorLayout';
import KanbanBoard from './components/kanban/KanbanBoard';
import CanvasComponent from './components/canvas/CanvasView';
import { AppView } from './types/app';
import './App.css';

// View components
const EditorView: React.FC = () => <EditorLayout />;

const KanbanView: React.FC = () => <KanbanBoard />;

const CanvasView: React.FC = () => <CanvasComponent />;

const AppContent: React.FC = () => {
  const { currentView, loadPreferences } = useAppStore();

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const renderCurrentView = () => {
    switch (currentView) {
      case AppView.HOME:
        return <HomeView />;
      case AppView.EDITOR:
        return <EditorView />;
      case AppView.KANBAN:
        return <KanbanView />;
      case AppView.CANVAS:
        return <CanvasView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app">
      <Navigation />
      <main className="app-main">
        <MainLayout>
          {renderCurrentView()}
        </MainLayout>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PopupProvider>
        <AppContent />
      </PopupProvider>
    </ThemeProvider>
  );
};

export default App;
