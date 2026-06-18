import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "defaultSeasonId";
const storageListeners = new Set<() => void>();

/** Returns null if localStorage is unavailable (e.g. Safari private mode) */
function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // silently ignore when storage is blocked
  }
}

function subscribeStorage(listener: () => void): () => void {
  storageListeners.add(listener);
  return () => {
    storageListeners.delete(listener);
  };
}

function notifyStorageListeners(): void {
  storageListeners.forEach((listener) => listener());
}

/** Reads and writes the default season ID to localStorage */
export function useDefaultSeason() {
  const defaultSeasonId = useSyncExternalStore(subscribeStorage, readStorage, () => null);

  const saveDefault = useCallback((id: string) => {
    writeStorage(id);
    notifyStorageListeners();
  }, []);

  return { defaultSeasonId, saveDefault };
}
