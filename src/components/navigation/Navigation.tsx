import React from 'react';
import { Moon, Sun, FileText, Layout, GitBranch, Home } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppStore } from '../../stores/appStore';
import { AppView } from '../../types/app';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { currentView, switchToView } = useAppStore();

  const views = [
    { id: AppView.HOME, title: 'Home', icon: Home },
    { id: AppView.EDITOR, title: 'Editor', icon: FileText },
    { id: AppView.KANBAN, title: 'Kanban', icon: Layout },
    { id: AppView.CANVAS, title: 'Canvas', icon: GitBranch },
  ];

  return (
    <nav className="navigation" onContextMenu={(e) => e.preventDefault()}>
      <div className="nav-brand">
        <h1 className="nav-title">Game Hub</h1>
      </div>

      <div className="nav-views">
        {views.map((view) => {
          const IconComponent = view.icon;
          return (
            <button
              key={view.id}
              className={`nav-view-btn ${currentView === view.id ? 'active' : ''}`}
              onClick={() => switchToView(view.id)}
              title={view.title}
            >
              <IconComponent size={20} />
              <span>{view.title}</span>
            </button>
          );
        })}
      </div>

      <div className="nav-controls">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
