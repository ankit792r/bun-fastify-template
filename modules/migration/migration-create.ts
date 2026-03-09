import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

export async function createMigration(name: string) {
  const migrationsDir = path.resolve(__dirname, ".migrations");

  if (!existsSync(migrationsDir)) mkdirSync(migrationsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHmmss

  const slug = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");

  const filename = `${timestamp}_${slug}.ts`;
  const filePath = path.join(migrationsDir, filename);

  const template = `import { transformEachDocument } from '../helpers.js';
import type { MigrationFileExport } from '../types.js';

const migration: MigrationFileExport = {
  name: '${name}',
  description: '${name}',
  containers: ['REPLACE_ME'], // container(s) this migration touches

  up: async (context) => {
    await transformEachDocument(context, {
      container: context.getContainer('REPLACE_ME'),
      query: 'SELECT * FROM c WHERE c.type = "example"',
      transform: (doc) => ({ ...doc, newField: 'value' }),
      getPartitionKey: (doc) => doc.id, // adjust to your partition key
    });
  },
};

export default migration;
`;

  writeFileSync(filePath, template, "utf-8");
  return filePath;
}
