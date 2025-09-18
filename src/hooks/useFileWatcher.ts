import { useEffect, useRef } from 'react';
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
  const {
    enabled = true,
    onFileChanged,
    onFileCreated,
    onFileDeleted,
    onFileRenamed
  } = options;

  const watcherIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!watchPath || !enabled) {
      return;
    }

    let unlistenFileChanged: (() => void) | null = null;
    let unlistenFileCreated: (() => void) | null = null;
    let unlistenFileDeleted: (() => void) | null = null;
    let unlistenFileRenamed: (() => void) | null = null;

    const setupWatcher = async () => {
      try {
        // Start watching the directory
        const watcherId = await invoke<string>('start_file_watcher', {
          path: watchPath
        });
        watcherIdRef.current = watcherId;

        // Listen for file system events
        if (onFileChanged) {
          unlistenFileChanged = await listen(`file-changed-${watcherId}`, (event) => {
            const filePath = event.payload as string;
            onFileChanged(filePath);
          });
        }

        if (onFileCreated) {
          unlistenFileCreated = await listen(`file-created-${watcherId}`, (event) => {
            const filePath = event.payload as string;
            onFileCreated(filePath);
          });
        }

        if (onFileDeleted) {
          unlistenFileDeleted = await listen(`file-deleted-${watcherId}`, (event) => {
            const filePath = event.payload as string;
            onFileDeleted(filePath);
          });
        }

        if (onFileRenamed) {
          unlistenFileRenamed = await listen(`file-renamed-${watcherId}`, (event) => {
            const { old_path, new_path } = event.payload as { old_path: string; new_path: string };
            onFileRenamed(old_path, new_path);
          });
        }
      } catch (error) {
        console.error('Failed to setup file watcher:', error);
      }
    };

    setupWatcher();

    return () => {
      // Cleanup listeners
      unlistenFileChanged?.();
      unlistenFileCreated?.();
      unlistenFileDeleted?.();
      unlistenFileRenamed?.();

      // Stop the watcher
      if (watcherIdRef.current) {
        invoke('stop_file_watcher', { watcherId: watcherIdRef.current }).catch(
          (error) => console.error('Failed to stop file watcher:', error)
        );
        watcherIdRef.current = null;
      }
    };
  }, [watchPath, enabled, onFileChanged, onFileCreated, onFileDeleted, onFileRenamed]);

  return {
    isWatching: watcherIdRef.current !== null
  };
};
