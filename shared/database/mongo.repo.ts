import { ObjectId, type Collection } from "mongodb";
import type { Repository } from "./repository";
import type { Entity } from "./entity";

export class MongoRepository<T extends { id: string }>
  implements Repository<T>
{
  constructor(
    private collection: Collection,
    private entityConfig: Entity<T>,
  ) {}

  private toDomain(doc: any): T {
    return {
      ...doc,
      id: doc._id.toString(),
    };
  }

  async create(entity: Omit<T, "id">): Promise<T> {
    const result = await this.collection.insertOne(entity);

    return {
      ...(entity as T),
      id: result.insertedId.toString(),
    };
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.findOne({
      _id: new ObjectId(id),
    });

    return doc ? this.toDomain(doc) : null;
  }

  async update(
    id: string,
    entity: Partial<Omit<T, "id">>,
  ): Promise<T> {
    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: entity },
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error("Not found");

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({
      _id: new ObjectId(id),
    });
  }

  async query(
    filter: Partial<Omit<T, "id">> = {},
    options?: { limit?: number; offset?: number },
  ): Promise<T[]> {
    const cursor = this.collection
      .find(filter)
      .skip(options?.offset ?? 0)
      .limit(options?.limit ?? 10);

    const docs = await cursor.toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async count(filter: Partial<Omit<T, "id">> = {}): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async createMany(entities: Omit<T, "id">[]): Promise<T[]> {
    const result = await this.collection.insertMany(entities);
    if (!result.insertedIds) throw new Error("Failed to create many entities");
    return entities.map((entity) => this.toDomain(entity));
  }
}