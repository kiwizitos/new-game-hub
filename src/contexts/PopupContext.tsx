import React, { createContext, useContext, useState, ReactNode } from 'react';
import Popup, { PopupProps, PopupAction } from '../components/common/Popup';
import InputPopup from '../components/common/InputPopup';

interface PopupContextType {
  showPopup: (config: Omit<PopupProps, 'isOpen' | 'onClose'>) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  showAlert: (title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  showInput: (title: string, message: string, onConfirm: (value: string) => void, options?: { placeholder?: string; defaultValue?: string }) => void;
  closePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popupConfig, setPopupConfig] = useState<PopupProps | null>(null);
  const [inputPopupConfig, setInputPopupConfig] = useState<{
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
  } | null>(null);

  const showPopup = (config: Omit<PopupProps, 'isOpen' | 'onClose'>) => {
    setPopupConfig({
      ...config,
      isOpen: true,
      onClose: closePopup,
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    const actions: PopupAction[] = [
      {
        label: 'Cancelar',
        action: () => {
          if (onCancel) onCancel();
        },
        style: 'secondary'
      },
      {
        label: 'Confirmar',
        action: onConfirm,
        style: 'danger'
      }
    ];

    showPopup({
      title,
      message,
      type: 'confirm',
      actions,
      showCloseButton: false
    });
  };

  const showAlert = (
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) => {
    const actions: PopupAction[] = [
      {
        label: 'OK',
        action: () => {},
        style: 'primary'
      }
    ];

    showPopup({
      title,
      message,
      type,
      actions
    });
  };

  const showInput = (
    title: string,
    message: string,
    onConfirm: (value: string) => void,
    options?: { placeholder?: string; defaultValue?: string }
  ) => {
    setInputPopupConfig({
      title,
      message,
      placeholder: options?.placeholder || '',
      defaultValue: options?.defaultValue || '',
      onConfirm: (value: string) => {
        onConfirm(value);
        closeInputPopup();
      },
      onCancel: closeInputPopup
    });
  };

  const closePopup = () => {
    setPopupConfig(null);
  };

  const closeInputPopup = () => {
    setInputPopupConfig(null);
  };

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showAlert, showInput, closePopup }}>
      {children}
      {popupConfig && <Popup {...popupConfig} />}
      {inputPopupConfig && (
        <InputPopup
          isOpen={true}
          {...inputPopupConfig}
        />
      )}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextType => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

export default PopupContext;
