import React from 'react';
import { FileText, Layout, GitBranch, FolderOpen } from 'lucide-react';
import './ViewPlaceholder.css';

interface ViewPlaceholderProps {
  type: 'kanban' | 'canvas' | 'editor';
  title: string;
  description: string;
  currentFile?: string | null;
  expectedFileType?: string;
}

const ViewPlaceholder: React.FC<ViewPlaceholderProps> = ({
  type,
  title,
  description,
  currentFile,
  expectedFileType
}) => {
  const getIcon = () => {
    switch (type) {
      case 'kanban':
        return <Layout size={64} />;
      case 'canvas':
        return <GitBranch size={64} />;
      case 'editor':
        return <FileText size={64} />;
      default:
        return <FolderOpen size={64} />;
    }
  };

  const getHelperText = () => {
    if (!currentFile) {
      return `Selecione um arquivo ${expectedFileType || ''} no explorador para começar.`;
    }
    
    // Se há currentFile mas não é compatível, ainda mostra a descrição padrão
    // A mensagem de erro será mostrada separadamente
    return description;
  };

  const shouldShowError = currentFile && expectedFileType && !currentFile.endsWith(expectedFileType);

  return (
    <div className="view-placeholder">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          {getIcon()}
        </div>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-description">{getHelperText()}</p>
        
        {!currentFile && (
          <div className="placeholder-steps">
            <h3>Como começar:</h3>
            <ol>
              <li>Selecione uma pasta no explorador de arquivos</li>
              <li>Crie um novo arquivo usando os templates da Home</li>
              <li>Ou selecione um arquivo {expectedFileType || ''} existente</li>
            </ol>
          </div>
        )}
        
        {shouldShowError && (
          <div className="placeholder-error">
            <p>
              <strong>Arquivo atual:</strong> {currentFile.split('/').pop()}<br/>
              <strong>Tipo esperado:</strong> {expectedFileType}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewPlaceholder;
