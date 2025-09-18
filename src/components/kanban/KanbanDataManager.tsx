import React, { useState } from 'react';
import { Download, Upload, Save, FileText } from 'lucide-react';
import { useKanbanStore } from '../../stores/kanbanStore';
import { usePopup } from '../../contexts/PopupContext';

const KanbanDataManager: React.FC = () => {
  const { exportKanbanData, importKanbanData, saveKanbanData } = useKanbanStore();
  const { showAlert } = usePopup();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = async () => {
    try {
      const jsonData = await exportKanbanData();
      
      // Create and download file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanban-board-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showAlert('Sucesso', 'Dados exportados com sucesso!', 'success');
    } catch (error) {
      showAlert('Erro', 'Erro ao exportar dados', 'error');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      showAlert('Aviso', 'Por favor, cole os dados JSON', 'warning');
      return;
    }

    try {
      await importKanbanData(importText);
      setImportText('');
      setShowImport(false);
      showAlert('Sucesso', 'Dados importados com sucesso!', 'success');
    } catch (error) {
      showAlert('Erro', 'Erro ao importar dados: formato inválido', 'error');
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importKanbanData(text);
      showAlert('Sucesso', 'Arquivo importado com sucesso!', 'success');
    } catch (error) {
      showAlert('Erro', 'Erro ao importar arquivo', 'error');
    }

    // Reset input
    event.target.value = '';
  };

  const handleSave = async () => {
    try {
      await saveKanbanData();
      showAlert('Sucesso', 'Dados salvos com sucesso!', 'success');
    } catch (error) {
      showAlert('Erro', 'Erro ao salvar dados', 'error');
    }
  };

  return (
    <div className="kanban-data-manager">
      <div className="kanban-data-manager-actions">
        <button
          onClick={handleSave}
          className="kanban-action-button kanban-action-button--save"
          title="Salvar dados"
        >
          <Save size={16} />
          Salvar
        </button>

        <button
          onClick={handleExport}
          className="kanban-action-button kanban-action-button--export"
          title="Exportar dados para arquivo JSON"
        >
          <Download size={16} />
          Exportar
        </button>

        <label className="kanban-action-button kanban-action-button--import-file">
          <FileText size={16} />
          Importar Arquivo
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
        </label>

        <button
          onClick={() => setShowImport(!showImport)}
          className="kanban-action-button kanban-action-button--import"
          title="Importar dados de texto JSON"
        >
          <Upload size={16} />
          Importar JSON
        </button>
      </div>

      {showImport && (
        <div className="kanban-import-panel">
          <div className="kanban-import-header">
            <h4>Importar Dados JSON</h4>
            <button
              onClick={() => setShowImport(false)}
              className="kanban-close-button"
            >
              ×
            </button>
          </div>
          
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Cole aqui os dados JSON do Kanban..."
            className="kanban-import-textarea"
            rows={10}
          />
          
          <div className="kanban-import-actions">
            <button
              onClick={handleImport}
              className="kanban-action-button kanban-action-button--confirm"
              disabled={!importText.trim()}
            >
              Confirmar Importação
            </button>
            <button
              onClick={() => {
                setImportText('');
                setShowImport(false);
              }}
              className="kanban-action-button kanban-action-button--cancel"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanDataManager;
