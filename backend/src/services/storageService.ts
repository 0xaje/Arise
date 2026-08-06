import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export class StorageService {
  private storageDir: string;

  constructor() {
    this.storageDir = process.env.EVIDENCE_STORAGE_PATH || './storage/evidence';
  }

  private async ensureDir() {
    await fs.mkdir(this.storageDir, { recursive: true });
  }

  public async saveFile(buffer: Buffer, fileName: string, mimeType: string): Promise<{ url: string; sha256: string; sizeBytes: number }> {
    await this.ensureDir();
    
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(fileName) || '.bin';
    const uniqueName = `${Date.now()}-${sha256.substring(0, 8)}${ext}`;
    const filePath = path.join(this.storageDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    return {
      url: `/api/v1/evidence/files/${uniqueName}`,
      sha256,
      sizeBytes: buffer.length,
    };
  }

  public getFilePath(fileName: string): string {
    return path.join(this.storageDir, fileName);
  }
}

export const storageService = new StorageService();
