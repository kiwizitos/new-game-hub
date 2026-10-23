import { useEffect, useRef, useCallback, useState } from 'react';
import { usePopup } from '../contexts/PopupContext';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: () => Promise<void>;
  enabled?: boolean;
  saveOnUnmount?: boolean;
}

export const useAutoSave = (data: unknown, options: UseAutoSaveOptions) => {
  const { delay = 2000, onSave, enabled = true, saveOnUnmount = false } = options;
  const { showAlert } = usePopup();
  const serialized = JSON.stringify(data);
  const latest = useRef({ serialized, onSave, enabled, saveOnUnmount, showAlert });
  latest.current = { serialized, onSave, enabled, saveOnUnmount, showAlert };
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | undefined>();
  const pendingRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);
  const [isSaving, setIsSaving] = useState(false);

  const saveData = useCallback((): Promise<boolean> => {
    if (pendingRef.current) return pendingRef.current;
    const run = async () => {
      // Coalesce edits during an in-flight write; older data must never finish last.
      while (latest.current.enabled && latest.current.serialized !== lastSavedRef.current) {
        const snapshot = latest.current;
        try {
          await snapshot.onSave();
          lastSavedRef.current = snapshot.serialized;
        } catch (error) {
          console.error('Auto-save failed:', error);
          snapshot.showAlert('Auto-save Error', `Failed to save: ${error}`, 'error');
          return false;
        }
      }
      return true;
    };
    if (!latest.current.enabled) return Promise.resolve(false);
    if (mountedRef.current) setIsSaving(true);
    pendingRef.current = run().finally(() => {
      pendingRef.current = null;
      if (mountedRef.current) setIsSaving(false);
    });
    return pendingRef.current;
  }, []);

  useEffect(() => {
    if (!enabled || serialized === lastSavedRef.current) return;
    timeoutRef.current = setTimeout(() => { void saveData(); }, delay);
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [serialized, delay, enabled, saveData]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (latest.current.saveOnUnmount) void saveData();
    };
  }, [saveData]);

  const forceSave = useCallback(async () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    return saveData();
  }, [saveData]);

  const hasUnsavedChanges = useCallback(() => serialized !== lastSavedRef.current, [serialized]);
  return { forceSave, hasUnsavedChanges, isSaving };
};
