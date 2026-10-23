import React, { lazy, Suspense, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { PopupProvider } from './contexts/PopupContext';
import { useAppStore } from './stores/appStore';
import Navigation from './components/navigation/Navigation';
import MainLayout from './components/layout/MainLayout';
import HomeView from './components/views/HomeView';
import { AppView } from './types/app';
import './App.css';

const EditorView = lazy(() => import('./components/layout/EditorLayout'));
const KanbanView = lazy(() => import('./components/kanban/KanbanBoard'));
const CanvasView = lazy(() => import('./components/canvas/CanvasView'));

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
          <Suspense fallback={<div role="status" className="p-4">Loading workspace...</div>}>
            {renderCurrentView()}
          </Suspense>
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
