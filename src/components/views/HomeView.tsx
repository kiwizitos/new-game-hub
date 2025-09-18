import React, { useState } from 'react';
import { FileText, Layout, GitBranch, Plus, Clock, Folder } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { AppView } from '../../types/app';
import TemplateModal from '../modals/TemplateModal';
import { Template } from '../../services/TemplateService';
import FileService from '../../services/FileService';
import { usePopup } from '../../contexts/PopupContext';
import './HomeView.css';

const HomeView: React.FC = () => {
  const { switchToView, setSelectedFile } = useAppStore();
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

  const recentFiles = [
    { name: 'Project Notes.md', type: 'markdown', lastModified: '2 hours ago' },
    { name: 'Sprint Planning.kanban', type: 'kanban', lastModified: '1 day ago' },
    { name: 'Ideas Map.canvas', type: 'canvas', lastModified: '3 days ago' },
  ];

  const openTemplateModal = (type: 'markdown' | 'kanban' | 'canvas') => {
    setTemplateModalType(type);
    setTemplateModalOpen(true);
  };

  const handleCreateFile = async (template: Template, fileName: string) => {
    try {
      const { currentFolder } = useAppStore.getState();
      
      if (!currentFolder) {
        alert('Por favor, selecione uma pasta no explorador de arquivos primeiro.');
        return;
      }

      const fullFileName = fileService.generateFileName(fileName, template.type);
      const filePath = `${currentFolder}/${fullFileName}`;
      
      // Criar o arquivo baseado no tipo
      switch (template.type) {
        case 'markdown':
          await fileService.saveMarkdownFile(filePath, template.content as string);
          break;
        case 'kanban':
          await fileService.createKanbanFile(filePath, template.content as any);
          break;
        case 'canvas':
          await fileService.createCanvasFile(filePath, template.content as any);
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
        <h1 className="home-title">Welcome to Game Hub</h1>
        <p className="home-subtitle">Your all-in-one workspace for notes, tasks, and ideas</p>
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
              <div
                key={feature.id}
                className="feature-card"
                onClick={() => switchToView(feature.id)}
                style={{ '--feature-color': feature.color } as React.CSSProperties}
              >
                <div className="feature-icon">
                  <feature.icon size={32} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Files */}
        <section className="home-section">
          <h2 className="section-title">
            <Clock size={20} />
            Recent Files
          </h2>
          <div className="recent-files">
            {recentFiles.map((file, index) => (
              <div key={index} className="recent-file-card">
                <div className={`file-icon ${file.type}`}>
                  {file.type === 'markdown' && <FileText size={16} />}
                  {file.type === 'kanban' && <Layout size={16} />}
                  {file.type === 'canvas' && <GitBranch size={16} />}
                </div>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-modified">{file.lastModified}</span>
                </div>
              </div>
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
