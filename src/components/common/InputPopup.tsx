import React, { useState, useEffect, useRef } from 'react';
import './Popup.css';

interface InputPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputPopup: React.FC<InputPopupProps> = ({
  isOpen,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-backdrop" onClick={onCancel}>
      <div className="popup-container popup-input" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 className="popup-title">{title}</h3>
        </div>
        
        <div className="popup-content">
          <p className="popup-message">{message}</p>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="popup-input-field"
            />
          </form>
        </div>
        
        <div className="popup-actions">
          <button
            type="button"
            onClick={onCancel}
            className="popup-action-button popup-action-button--secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (value.trim()) {
                onConfirm(value.trim());
              }
            }}
            className="popup-action-button popup-action-button--primary"
            disabled={!value.trim()}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputPopup;
