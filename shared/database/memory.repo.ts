import { randomUUID } from "crypto";
import type { Repository } from "./repository";
import type { Entity } from "./entity";

export class InMemoryRepository<T extends { id: string }>
  implements Repository<T> {
  private store = new Map<string, T>();

  constructor(private entityConfig: Entity<T>) { }

  async create(entity: Omit<T, "id">): Promise<T> {
    const validated = this.entityConfig.domainSchema.parse(entity);
    const id = randomUUID();
    const newEntity = { ...validated, id } as T;

    this.store.set(id, newEntity);
    return validated;
  }

  async findById(id: string): Promise<T | null> {
    const entity = this.store.get(id);
    if (!entity) return null;
    return this.entityConfig.domainSchema.parse(entity);
  }

  async update(
    id: string,
    entity: Partial<Omit<T, "id">>,
  ): Promise<T> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Not found");
    const validated = this.entityConfig.domainSchema.parse({ ...existing, ...entity });
    this.store.set(id, validated);
    return validated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error("Not found");
    this.store.delete(id);
  }

  async query(
    filter: Partial<Omit<T, "id">> = {},
  ): Promise<T[]> {
    return Array.from(this.store.values()).filter((item) =>
      Object.entries(filter).every(([key, value]) => item[key as keyof T] === value),
    ).map((item) => this.entityConfig.domainSchema.parse(item));
  }

  async count(filter: Partial<Omit<T, "id">> = {}): Promise<number> {
    return (await this.query(filter)).length;
  }

  async createMany(entities: Omit<T, "id">[]): Promise<T[]> {
    return Promise.all(entities.map((entity) => this.create(entity)));
  }
}