import { validateFilePath } from "./file-path";
import type { IBlobStorage } from "./storage-interface";

export class MemoryStorage implements IBlobStorage {
  /**
   * Private url format: memory://<containerName>/<filePath>
   * Public url format: <baseUrl>/<containerName>/<filePath>
   * Signed download url format: <baseUrl>/<containerName>/<filePath>?token=<jwtToken>
   * Token payload: publicUrl
   *
   * For example,
   * containerName: contracts
   * baseUrl: http://localhost:3000/api/files
   * filePath: ctr_XXX.pdf
   * Private URL: memory://contracts/ctr_XXX.pdf
   * Public URL: http://localhost:3000/api/files/contracts/ctr_XXX.pdf
   * Signed Download URL: http://localhost:3000/api/files/contracts/ctr_XXX.pdf?token=jwtToken
   */

  private readonly storage = new Map<string, Buffer>();

  constructor(
    // private readonly jwtSignUrlDownloadToken: SignDownloadTokenFn,
    private readonly containerName: string,
    private readonly baseUrl: string,
  ) {
    // if (!this.jwtSignUrlDownloadToken)
    //   throw new Error(
    //     'In-memory storage JWT sign URL download token function is required',
    //   );

    if (!this.containerName) {
      throw new Error('In-memory storage container name is required');
    }

    if (this.baseUrl.endsWith('/')) {
      throw new Error(
        `In-memory storage base URL must not end with a slash: ${this.baseUrl}`,
      );
    }

    if (this.containerName.includes('/')) {
      throw new Error(
        `In-memory storage container name must not contain slashes: ${this.containerName}`,
      );
    }
  }

  async upload(
    filePath: string,
    fileBuffer: Buffer,
    _contentType: string,
  ): Promise<string> {
    validateFilePath(filePath);
    this.storage.set(filePath, fileBuffer);
    return this.getStorageUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    validateFilePath(filePath);
    this.storage.delete(filePath);
  }

  async replace(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    return this.upload(filePath, fileBuffer, contentType);
  }

  async download(filePath: string): Promise<NodeJS.ReadableStream> {
    validateFilePath(filePath);
    const fileBuffer = this.storage.get(filePath);

    if (!fileBuffer) {
      throw new Error(`File not found: ${filePath}`);
    }

    return Readable.from(fileBuffer);
  }

  async generatePresignedUrlForDownload(
    filePath: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    validateFilePath(filePath);
    const url = this.getPublicUrl(filePath);
    // const token = this.jwtSignUrlDownloadToken(
    //   { url },
    //   expiresInSeconds || env.PRESIGNED_URL_DOWNLOAD_TOKEN_EXPIRY_MINUTES * 60,
    // );
    // return `${url}?token=${token}`;
    return `${url}?token=${expiresInSeconds}`;
  }

  getStorageBaseUrl(): string {
    return `memory://${this.containerName}`;
  }

  getStorageUrl(filePath: string): string {
    validateFilePath(filePath);
    return `memory://${this.containerName}/${filePath}`;
  }

  getPublicUrl(filePath: string): string {
    validateFilePath(filePath);
    return `${this.baseUrl}/${this.containerName}/${filePath}`;
  }

  extractFilePathFromUrl(fileUrl: string): string {
    const internalPrefix = `memory://${this.containerName}/`;
    if (fileUrl.startsWith(internalPrefix)) {
      const filePath = fileUrl.substring(internalPrefix.length);
      validateFilePath(filePath);
      return filePath;
    }

    const publicPrefix = `${this.baseUrl}/${this.containerName}/`;
    if (fileUrl.startsWith(publicPrefix)) {
      const urlWithoutQuery = fileUrl.split('?')[0] as string;
      const filePath = urlWithoutQuery.substring(publicPrefix.length);
      validateFilePath(filePath);
      return filePath;
    }

    throw new Error(
      `File URL does not belong to this in-memory storage: ${fileUrl}`,
    );
  }
}
