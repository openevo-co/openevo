import fs from 'fs';
import path from 'path';

/**
 * OpenEvo Knowledge Loader — Document & Vision Asset Loader
 *
 * Scans `loader_info/` in the project directory for:
 * - `docs/`   → .md, .txt, .json text files (loaded into memory)
 * - `assets/` → image files (cataloged by path + MIME type)
 *
 * Documents are formatted into a context block for LLM system prompt injection.
 * Image assets are cataloged for providers that support vision input.
 *
 * ⚠️ V0 BOUNDARY: No chunking or embedding. Full documents injected as context.
 */

export interface DocumentEntry {
  filename: string;
  content: string;
  path: string;
}

export interface AssetEntry {
  filename: string;
  path: string;
  mimeType: string;
}

export interface KnowledgeBase {
  documents: DocumentEntry[];
  assets: AssetEntry[];
}

const DOCUMENT_EXTENSIONS = new Set(['.md', '.txt', '.json']);

const IMAGE_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const IMAGE_EXTENSIONS = new Set(Object.keys(IMAGE_MIME_MAP));

export class KnowledgeLoader {
  private projectPath: string;
  private knowledge: KnowledgeBase = { documents: [], assets: [] };
  private loaded = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /** Scan loader_info/ and load all documents + catalog assets */
  load(): KnowledgeBase {
    if (this.loaded) return this.knowledge;

    const basePath = path.join(this.projectPath, 'loader_info');

    if (!fs.existsSync(basePath)) {
      this.loaded = true;
      return this.knowledge;
    }

    this.knowledge.documents = this.loadDocuments(path.join(basePath, 'docs'));
    this.knowledge.assets = this.catalogAssets(path.join(basePath, 'assets'));
    this.loaded = true;

    return this.knowledge;
  }

  /** Format all loaded documents into a single context string for LLM injection */
  formatContext(): string {
    this.ensureLoaded();

    if (this.knowledge.documents.length === 0) return '';

    const blocks = this.knowledge.documents.map(
      doc => `### ${doc.filename}\n${doc.content}`
    );

    return (
      `\n\n--- KNOWLEDGE BASE ---\n` +
      `The following documents provide reference knowledge. ` +
      `Use them to inform your responses when relevant:\n\n` +
      `${blocks.join('\n\n')}\n` +
      `--- END KNOWLEDGE BASE ---\n`
    );
  }

  /** Check if a specific document exists by filename (case-insensitive) */
  hasDocument(filename: string): boolean {
    this.ensureLoaded();
    const lower = filename.toLowerCase();
    return this.knowledge.documents.some(
      d => d.filename.toLowerCase() === lower
    );
  }

  /** Get a specific document by filename (case-insensitive) */
  getDocument(filename: string): DocumentEntry | undefined {
    this.ensureLoaded();
    const lower = filename.toLowerCase();
    return this.knowledge.documents.find(
      d => d.filename.toLowerCase() === lower
    );
  }

  /** Get the full knowledge base */
  getKnowledge(): KnowledgeBase {
    this.ensureLoaded();
    return this.knowledge;
  }

  private ensureLoaded(): void {
    if (!this.loaded) this.load();
  }

  private loadDocuments(docsDir: string): DocumentEntry[] {
    if (!fs.existsSync(docsDir)) return [];

    const entries: DocumentEntry[] = [];

    try {
      const files = fs.readdirSync(docsDir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!DOCUMENT_EXTENSIONS.has(ext)) continue;

        const filePath = path.join(docsDir, file);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          entries.push({ filename: file, content, path: filePath });
        } catch {
          // Skip unreadable files silently
        }
      }
    } catch {
      return [];
    }

    return entries;
  }

  private catalogAssets(assetsDir: string): AssetEntry[] {
    if (!fs.existsSync(assetsDir)) return [];

    const entries: AssetEntry[] = [];

    try {
      const files = fs.readdirSync(assetsDir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) continue;

        const filePath = path.join(assetsDir, file);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        entries.push({
          filename: file,
          path: filePath,
          mimeType: IMAGE_MIME_MAP[ext],
        });
      }
    } catch {
      return [];
    }

    return entries;
  }
}
