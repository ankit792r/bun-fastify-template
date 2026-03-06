import env from "../../instance/env";
import { MemoryStorage } from "./memory.storage";
import type { IBlobStorage } from "./storage-interface";

export type StorageType = typeof env.DEFAULT_BLOB_STORAGE_IMPL;

export type CreateBlobStorageOptions = {
  type: StorageType;
  containerName: string;
  blobStorageServiceUrl: string;
  diskStorageImplBasePath?: string;
  // jwtSignUrlDownloadToken?: SignDownloadTokenFn;
};

export function createBlobStorage(
  options: CreateBlobStorageOptions,
): IBlobStorage {
  switch (options.type) {
    case "memory": {
      if (!options.containerName)
        throw new Error("In-memory storage container name is required");

      if (!options.blobStorageServiceUrl)
        throw new Error("In-memory storage base URL is required");

      return new MemoryStorage(
        options.containerName,
        options.blobStorageServiceUrl,
      );
    }

    default:
      throw new Error("Invalid storage option provided");
  }
}

export function createDefaultBlobStorage(containerName: string): IBlobStorage {
  return createBlobStorage({
    type: env.DEFAULT_BLOB_STORAGE_IMPL,
    blobStorageServiceUrl: env.BLOB_STORAGE_SERVICE_URL,
    containerName,
    // jwtSignUrlDownloadToken: fastify.jwt.signDownloadToken,
  });
}
