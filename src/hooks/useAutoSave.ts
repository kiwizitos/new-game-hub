import { useEffect, useRef, useCallback } from 'react';
import { usePopup } from '../contexts/PopupContext';

interface UseAutoSaveOptions {
  delay?: number; // Delay em ms antes de salvar
  onSave: () => Promise<void>;
  enabled?: boolean;
}

export const useAutoSave = (
  data: any,
  options: UseAutoSaveOptions
) => {
  const { delay = 2000, onSave, enabled = true } = options;
  const { showAlert } = usePopup();
  const timeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const saveData = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;

    try {
      isSavingRef.current = true;
      await onSave();
      lastSavedRef.current = JSON.stringify(data);
      
      // Optional: Show a subtle save indicator
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
      showAlert('Auto-save Error', `Failed to save: ${error}`, 'error');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled, showAlert]);

  useEffect(() => {
    if (!enabled) return;

    const currentDataString = JSON.stringify(data);
    
    // Só salva se os dados mudaram
    if (currentDataString !== lastSavedRef.current && data) {
      // Cancela o timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Agenda novo save
      timeoutRef.current = setTimeout(() => {
        saveData();
      }, delay);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, saveData, enabled]);

  // Força um save imediato
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveData();
  }, [saveData]);

  // Verifica se há mudanças não salvas
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(data) !== lastSavedRef.current;
  }, [data]);

  return {
    forceSave,
    hasUnsavedChanges,
    isSaving: isSavingRef.current
  };
};
