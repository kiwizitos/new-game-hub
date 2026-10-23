import React, { useState } from 'react';
import { FileText, Layout, GitBranch, Plus, Clock, Folder, ArrowUpRight, Gamepad2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { AppView } from '../../types/app';
import TemplateModal from '../modals/TemplateModal';
import { Template } from '../../services/TemplateService';
import FileService from '../../services/FileService';
import { usePopup } from '../../contexts/PopupContext';
import './HomeView.css';

const HomeView: React.FC = () => {
  const { switchToView, setSelectedFile, viewSessions, currentFolder } = useAppStore();
  const { showAlert } = usePopup();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalType, setTemplateModalType] = useState<'markdown' | 'kanban' | 'canvas'>('markdown');

  const fileService = FileService.getInstance();

  const features = [
    {
      id: AppView.EDITOR,
      title: 'Markdown Editor',
      description: 'Create and edit markdown documents with live preview',
      icon: FileText,
      color: '#0066cc',
    },
    {
      id: AppView.KANBAN,
      title: 'Kanban Board',
      description: 'Organize tasks and projects with kanban boards',
      icon: Layout,
      color: '#28a745',
    },
    {
      id: AppView.CANVAS,
      title: 'Mind Canvas',
      description: 'Create visual mind maps and connect ideas',
      icon: GitBranch,
      color: '#6f42c1',
    },
  ];

  const recentFiles = features.flatMap((feature) => {
    const path = viewSessions[feature.id];
    return path ? [{ path, view: feature.id, name: path.split(/[\\/]/).pop(), type: fileService.getFileType(path) }] : [];
  });

  const openTemplateModal = (type: 'markdown' | 'kanban' | 'canvas') => {
    setTemplateModalType(type);
    setTemplateModalOpen(true);
  };

  const handleCreateFile = async (template: Template, fileName: string) => {
    try {
      const { currentFolder } = useAppStore.getState();
      
      if (!currentFolder) {
        showAlert('Selecione uma pasta', 'Selecione uma pasta no explorador de arquivos antes de criar um documento.', 'warning');
        return;
      }

      const fullFileName = fileService.generateFileName(fileName, template.type);
      const filePath = `${currentFolder}/${fullFileName}`;
      
      // Criar o arquivo baseado no tipo
      switch (template.type) {
        case 'markdown':
          await fileService.saveMarkdownFile(filePath, template.content);
          break;
        case 'kanban':
          await fileService.createKanbanFile(filePath, template.content);
          break;
        case 'canvas':
          await fileService.createCanvasFile(filePath, template.content);
          break;
      }

      // Selecionar o arquivo criado e navegar para a view apropriada
      setSelectedFile(filePath);
      
      switch (template.type) {
        case 'markdown':
          switchToView(AppView.EDITOR);
          break;
        case 'kanban':
          switchToView(AppView.KANBAN);
          break;
        case 'canvas':
          switchToView(AppView.CANVAS);
          break;
      }

      showAlert('Success', `File "${fullFileName}" created successfully!`, 'success');
    } catch (error) {
      console.error('Error creating file:', error);
      showAlert('Error', `Failed to create file: ${error}`, 'error');
    }
  };

  const quickActions = [
    { 
      label: 'New Markdown Document', 
      action: () => openTemplateModal('markdown'), 
      icon: FileText 
    },
    { 
      label: 'New Kanban Board', 
      action: () => openTemplateModal('kanban'), 
      icon: Layout 
    },
    { 
      label: 'New Canvas', 
      action: () => openTemplateModal('canvas'), 
      icon: GitBranch 
    },
  ];

  return (
    <div className="home-view" onContextMenu={(e) => e.preventDefault()}>
      <div className="home-header">
        <div className="home-eyebrow"><Gamepad2 size={18} /> YOUR GAME DEVELOPMENT WORKSPACE</div>
        <h1 className="home-title">Big ideas. Next steps.</h1>
        <p className="home-subtitle">Plan your next game, organize the work, and bring your ideas together.</p>
        <div className="workspace-location">
          <Folder size={16} aria-hidden="true" />
          <span>{currentFolder || 'Select a folder in Explorer to start your workspace'}</span>
        </div>
      </div>

      <div className="home-content">
        {/* Quick Actions */}
        <section className="home-section">
          <h2 className="section-title">
            <Plus size={20} />
            Quick Start
          </h2>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-card"
                onClick={action.action}
              >
                <action.icon size={24} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Features Overview */}
        <section className="home-section">
          <h2 className="section-title">
            <Folder size={20} />
            Features
          </h2>
          <div className="features-grid">
            {features.map((feature) => (
              <button
                type="button"
                key={feature.id}
                className="feature-card"
                onClick={() => switchToView(feature.id)}
                style={{ '--feature-color': feature.color } as React.CSSProperties}
              >
                <div className="feature-icon">
                  <feature.icon size={32} />
                </div>
                <span className="feature-title">{feature.title}</span>
                <span className="feature-description">{feature.description}</span>
                <span className="feature-open">Open workspace <ArrowUpRight size={16} /></span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Files */}
        <section className="home-section">
          <h2 className="section-title">
            <Clock size={20} />
            Continue where you left off
          </h2>
          <div className="recent-files">
            {recentFiles.length === 0 && (
              <div className="recent-empty">
                <Clock size={24} aria-hidden="true" />
                <p>No files opened yet</p>
                <span>Create a document or open a file from Explorer. Your last file in each workspace will appear here.</span>
              </div>
            )}
            {recentFiles.map((file) => (
              <button type="button" key={file.path} className="recent-file-card" onClick={() => switchToView(file.view)} title={file.path}>
                <div className={`file-icon ${file.type}`}>
                  {file.type === 'markdown' && <FileText size={16} />}
                  {file.type === 'kanban' && <Layout size={16} />}
                  {file.type === 'canvas' && <GitBranch size={16} />}
                </div>
                <span className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-modified">{file.path}</span>
                </span>
                <ArrowUpRight size={16} className="recent-file-arrow" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelectTemplate={handleCreateFile}
        defaultType={templateModalType}
      />
    </div>
  );
};

export default HomeView;
