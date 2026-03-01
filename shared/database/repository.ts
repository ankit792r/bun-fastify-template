import type { Document } from "mongodb";

// export interface Repository<T extends Document> {
//   create<S extends T = T>(entity: T): Promise<S>;
//   createMany<S extends T = T>(entities: T[]): Promise<S[]>;
//   update<S extends T = T>(id: string, entity: Partial<T>): Promise<S>;
//   delete<_S extends T = T>(id: string): Promise<void>;
//   query<S extends T = T>(
//     params: { name: string; value: string }[],
//     fields?: readonly string[],
//     options?: {
//       maxItemCount?: number;
//       pageToken?: string;
//     },
//   ): Promise<{ items: S[]; pageToken?: string }>;
//   count<_S extends T = T>(
//     params: { name: string; value: string }[],
//   ): Promise<number>;
// }


export interface Repository<T extends { id: string }> {
  create(entity: Omit<T, "id">): Promise<T>;

  createMany(entities: Omit<T, "id">[]): Promise<T[]>;

  update(id: string, entity: Partial<Omit<T, "id">>): Promise<T>;

  delete(id: string): Promise<void>;

  findById(id: string): Promise<T | null>;

  query(
    filter?: Partial<Omit<T, "id">>,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<T[]>;

  count(filter?: Partial<Omit<T, "id">>): Promise<number>;
}