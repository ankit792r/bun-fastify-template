import type { ICache } from "./cache.interface";

export type InMemoryCacheType = Map<
  string,
  { value: unknown; expiresAt?: number }
>;

export class MemoryCache implements ICache {
  private store: InMemoryCacheType;

  constructor() {
    this.store = new Map();
  }

  static fromMap(store: InMemoryCacheType): MemoryCache {
    const cache = new MemoryCache();
    cache.store = store;
    return cache;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMillis?: number): Promise<void> {
    this.store.set(key, {
      value: value as unknown,
      expiresAt: ttlMillis ? Date.now() + ttlMillis : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
