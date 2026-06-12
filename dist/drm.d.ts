/** Encrypt a plaintext rule into a .persona binary */
export declare function encryptPersona(plaintext: string, salt: string): Buffer;
/** Decrypt a .persona binary back to plaintext rule (in-memory only!) */
export declare function decryptPersona(personaBinary: Buffer): string;
/** Load and decrypt a .persona file from disk into memory */
export declare function loadPersonaCartridge(personaFilePath: string): string;
/** Scan a project directory for any .persona files and load the first one found */
export declare function findAndLoadPersona(projectPath: string): string | null;
