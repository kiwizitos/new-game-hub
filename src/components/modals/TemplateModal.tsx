import React, { useState } from 'react';
import { X, FileText, Layout, GitBranch, Search } from 'lucide-react';
import TemplateService, { Template } from '../../services/TemplateService';
import './TemplateModal.css';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template, fileName: string) => void;
  defaultType?: 'markdown' | 'kanban' | 'canvas';
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  defaultType = 'markdown'
}) => {
  const [selectedType, setSelectedType] = useState<'markdown' | 'kanban' | 'canvas'>(defaultType);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const templateService = TemplateService.getInstance();

  if (!isOpen) return null;

  const templates = templateService.getTemplatesByType(selectedType).filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateFile = () => {
    if (selectedTemplate && fileName.trim()) {
      onSelectTemplate(selectedTemplate, fileName.trim());
      onClose();
      // Reset form
      setFileName('');
      setSelectedTemplate(null);
      setSearchQuery('');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return <FileText size={16} />;
      case 'kanban':
        return <Layout size={16} />;
      case 'canvas':
        return <GitBranch size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getTypeExtension = (type: string) => {
    switch (type) {
      case 'markdown':
        return '.md';
      case 'kanban':
        return '.kanban';
      case 'canvas':
        return '.canvas';
      default:
        return '.md';
    }
  };

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <h2>Create New File</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="template-modal-content">
          {/* Type Selection */}
          <div className="type-selector">
            <button
              className={`type-btn ${selectedType === 'markdown' ? 'active' : ''}`}
              onClick={() => setSelectedType('markdown')}
            >
              <FileText size={20} />
              Markdown
            </button>
            <button
              className={`type-btn ${selectedType === 'kanban' ? 'active' : ''}`}
              onClick={() => setSelectedType('kanban')}
            >
              <Layout size={20} />
              Kanban
            </button>
            <button
              className={`type-btn ${selectedType === 'canvas' ? 'active' : ''}`}
              onClick={() => setSelectedType('canvas')}
            >
              <GitBranch size={20} />
              Canvas
            </button>
          </div>

          {/* Search */}
          <div className="search-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Template Grid */}
          <div className="templates-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="template-icon">
                  {getTypeIcon(template.type)}
                </div>
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>
                <div className="template-tags">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="template-category">{template.category}</div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="no-templates">
              <p>No templates found matching your search.</p>
            </div>
          )}
        </div>

        <div className="template-modal-footer">
          <div className="file-name-input">
            <label htmlFor="fileName">File Name:</label>
            <div className="file-name-container">
              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={`Enter file name`}
                className="file-input"
              />
              <span className="file-extension">{getTypeExtension(selectedType)}</span>
            </div>
          </div>
          
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="create-btn"
              onClick={handleCreateFile}
              disabled={!selectedTemplate || !fileName.trim()}
            >
              Create File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
