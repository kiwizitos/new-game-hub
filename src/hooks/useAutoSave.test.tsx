// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoSave } from './useAutoSave';

const { showAlert } = vi.hoisted(() => ({ showAlert: vi.fn() }));
vi.mock('../contexts/PopupContext', () => ({ usePopup: () => ({ showAlert }) }));

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('customization autosave', () => {
  it('does not postpone saving on callback-only re-renders', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(() => useAutoSave('data', { onSave: () => save() }));
    await act(() => vi.advanceTimersByTimeAsync(1500));
    rerender();
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(save).toHaveBeenCalledOnce();
  });

  it('serializes writes and saves edits made while a previous write is pending', async () => {
    let finish: () => void = () => {};
    const saved: string[] = [];
    const first = new Promise<void>(resolve => { finish = resolve; });
    const save = vi.fn(async (value: string) => {
      if (value === 'old') await first;
      saved.push(value);
    });
    const { rerender, result } = renderHook(({ value }) => useAutoSave(value, {
      onSave: () => save(value),
    }), { initialProps: { value: 'old' } });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    rerender({ value: 'new' });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); await first; });
    expect(saved).toEqual(['old', 'new']);
    expect(result.current.hasUnsavedChanges()).toBe(false);
  });

  it('flushes pending per-file customization when the editor unmounts', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutoSave('models', { onSave: save, saveOnUnmount: true }));
    await act(async () => { unmount(); });
    expect(save).toHaveBeenCalledOnce();
  });

  it('never writes when disabled and surfaces failed writes without marking them saved', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Disk full'));
    const { rerender, result } = renderHook(({ enabled }) => useAutoSave('models', {
      onSave: save, enabled, saveOnUnmount: true,
    }), { initialProps: { enabled: false } });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(showAlert).toHaveBeenCalledWith('Auto-save Error', expect.stringContaining('Disk full'), 'error');
    expect(result.current.hasUnsavedChanges()).toBe(true);
    let saved: boolean | undefined;
    await act(async () => { saved = await result.current.forceSave(); });
    expect(saved).toBe(false);
    rerender({ enabled: false });
  });
});
