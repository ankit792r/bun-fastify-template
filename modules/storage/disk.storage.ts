import env from "../../instance/env";
import { dirname, join, resolve } from "path"
import type { IBlobStorage } from "./storage-interface";
import { createReadStream, existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from "fs";
import { validateFilePath } from "./file-path";

export class DiskStorage implements IBlobStorage {

  private readonly rootPath: string

  constructor(
    private readonly basePath: string,
    private readonly baseUrl: string,
    private readonly bucketName: string,
    // private readonly jwtSignUrlDownloadToken: SignDownloadTokenFn,
    // private readonly cdnUrl?: string,
  ) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'Disk storage should not be used in production, this code is unsafe and not secure',
      );
    }

    this.rootPath = resolve(basePath)

    if (!this.bucketName)
      throw new Error('Disk storage bucket name is required');

    if (this.baseUrl.endsWith('/'))
      throw new Error(
        `Disk storage base URL must not end with a slash: ${this.baseUrl}`,
      );

    if (this.bucketName.includes('/'))
      throw new Error(
        `Disk storage bucket name must not contain slashes: ${this.bucketName}`,
      );

    if (!existsSync(this.rootPath))
      throw new Error(
        `Disk storage base path does not exist: ${this.rootPath}`,
      );

    if (!statSync(this.rootPath).isDirectory())
      throw new Error(
        `Disk storage base path is not a directory: ${this.rootPath}`,
      );

    const bucketPath = `${this.rootPath}/${this.bucketName}`

    // Create container directory if it doesn't exist
    if (!existsSync(bucketPath))
      mkdirSync(bucketPath, { recursive: true });
    else if (!statSync(bucketPath).isDirectory())
      throw new Error(
        `Disk storage container path is not a directory: ${bucketPath}`,
      )
  }


  private resolvePath(filePath: string) {
    const absolutePath = join(
      this.rootPath,
      this.bucketName,
      filePath,
    );

    if (!absolutePath.startsWith(this.rootPath))
      throw new Error(
        `Attempted to access path outside disk storage root: ${absolutePath}`,
      );

    return absolutePath;
  }

  async upload(filePath: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    validateFilePath(filePath);

    const absolutePath = this.resolvePath(filePath);
    const fileDir = dirname(absolutePath);

    if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });

    writeFileSync(absolutePath, fileBuffer);

    return this.getStorageUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    validateFilePath(filePath);
    const absolutePath = this.resolvePath(filePath);

    if (existsSync(absolutePath)) unlinkSync(absolutePath);
  }
  async replace(filePath: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    return this.upload(filePath, fileBuffer, contentType);
  }

  async download(filePath: string): Promise<NodeJS.ReadableStream> {

    validateFilePath(filePath); const absolutePath = this.resolvePath(filePath);

    if (!existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    if (!statSync(absolutePath).isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    return createReadStream(absolutePath);
  }

  async generatePresignedUrlForDownload(filePath: string, expiresInSeconds?: number): Promise<string> {

    validateFilePath(filePath);
    const url = this.getPublicUrl(filePath);

    // const token = this.jwtSignUrlDownloadToken(
    //   { url },
    //   expiresInSeconds || env.PRESIGNED_URL_DOWNLOAD_TOKEN_EXPIRY_MINUTES * 60,
    // );
    return `${url}?token=${expiresInSeconds}`;
  }

  getStorageUrl(filePath: string): string {
    return `file://${this.basePath}/${this.bucketName}`;
  }
  getPublicUrl(filePath: string): string {
    validateFilePath(filePath);
    const base = this.baseUrl // this.cdnUrl ?? this.baseUrl;
    return `${base}/${this.bucketName}/${filePath}`;
  }


}
