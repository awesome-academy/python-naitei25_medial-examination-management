import { LocalStorageKeys } from "../constants/storageKeys";

type LocalStorageKey = typeof LocalStorageKeys[keyof typeof LocalStorageKeys];

export const storage = {
  set<T>(key: LocalStorageKey, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get<T>(key: LocalStorageKey): T | null {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  },

  remove(key: LocalStorageKey): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },

  setRaw(key: LocalStorageKey, value: string): void {
    localStorage.setItem(key, value);
  },

  getRaw(key: LocalStorageKey): string | null {
    return localStorage.getItem(key);
  },
};