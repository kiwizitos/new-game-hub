import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Folder } from 'lucide-react';
import FileExplorer from '../sidebar/FileExplorer';
import { useAppStore } from '../../stores/appStore';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { setSelectedFile } = useAppStore();

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    console.log('Selected file:', filePath);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="main-layout">
      {/* Collapsible Sidebar */}
      <div className={`main-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Folder size={16} />
            {!sidebarCollapsed && <span>Explorer</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <div className="sidebar-content">
            <FileExplorer onFileSelect={handleFileSelect} />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content" onContextMenu={(e) => e.preventDefault()}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
