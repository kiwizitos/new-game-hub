import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface FileWatcherOptions {
  enabled?: boolean;
  onFileChanged?: (path: string) => void;
  onFileCreated?: (path: string) => void;
  onFileDeleted?: (path: string) => void;
  onFileRenamed?: (oldPath: string, newPath: string) => void;
}

export const useFileWatcher = (
  watchPath: string | null,
  options: FileWatcherOptions = {}
) => {
  const { enabled = true } = options;
  const callbacks = useRef(options);
  callbacks.current = options;
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    setIsWatching(false);
    if (!watchPath || !enabled) {
      return;
    }

    let disposed = false;
    let watcherId: string | null = null;
    const unlisteners: Array<() => void> = [];
    const cleanup = () => {
      unlisteners.splice(0).forEach((unlisten) => unlisten());
      if (watcherId) {
        const id = watcherId;
        watcherId = null;
        invoke('stop_file_watcher', { watcherId: id }).catch(
          (error) => console.error('Failed to stop file watcher:', error)
        );
      }
    };
    const subscribe = async <T,>(name: string, callback: (payload: T) => void) => {
      if (disposed) return;
      const unlisten = await listen<T>(name, (event) => {
        if (!disposed) callback(event.payload);
      });
      if (disposed) unlisten();
      else unlisteners.push(unlisten);
    };

    const setupWatcher = async () => {
      try {
        // Start watching the directory
        watcherId = await invoke<string>('start_file_watcher', {
          path: watchPath
        });
        if (disposed) {
          cleanup();
          return;
        }
        await subscribe<string>(`file-changed-${watcherId}`, (path) => callbacks.current.onFileChanged?.(path));
        await subscribe<string>(`file-created-${watcherId}`, (path) => callbacks.current.onFileCreated?.(path));
        await subscribe<string>(`file-deleted-${watcherId}`, (path) => callbacks.current.onFileDeleted?.(path));
        await subscribe<{ old_path: string; new_path: string }>(`file-renamed-${watcherId}`, ({ old_path, new_path }) =>
          callbacks.current.onFileRenamed?.(old_path, new_path));
        if (!disposed) setIsWatching(true);
      } catch (error) {
        cleanup();
        console.error('Failed to setup file watcher:', error);
      }
    };

    setupWatcher();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [watchPath, enabled]);

  return {
    isWatching
  };
};
