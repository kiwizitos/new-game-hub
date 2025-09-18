import React from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle, X } from 'lucide-react';
import './Popup.css';

export interface PopupAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'danger' | 'secondary';
}

export interface PopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  actions?: PopupAction[];
  onClose: () => void;
  showCloseButton?: boolean;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  actions = [],
  onClose,
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} className="popup-icon-warning" />;
      case 'error':
        return <X size={24} className="popup-icon-error" />;
      case 'success':
        return <CheckCircle size={24} className="popup-icon-success" />;
      case 'confirm':
        return <Trash2 size={24} className="popup-icon-warning" />;
      default:
        return <Info size={24} className="popup-icon-info" />;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="popup-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={`popup-container popup-container--${type}`}>
        <div className="popup-header">
          <div className="popup-icon">
            {getIcon()}
          </div>
          <div className="popup-title-section">
            <h3 className="popup-title">{title}</h3>
            {showCloseButton && (
              <button
                className="popup-close-button"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="popup-content">
          <p className="popup-message">{message}</p>
        </div>

        {actions.length > 0 && (
          <div className="popup-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`popup-action-button popup-action-button--${action.style || 'secondary'}`}
                onClick={() => {
                  action.action();
                  onClose();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
