import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
/**
 * OpenEvo DRM Module — Persona Cartridge Protection
 *
 * Encrypts premium Persona Cartridges (.persona files) using AES-256-GCM.
 * The decrypted Rule (system prompt) exists ONLY in RAM,
 * never written to disk in plaintext.
 *
 * Flow:
 * 1. User purchases a Persona Cartridge from alivevo.com
 * 2. They download an encrypted .persona binary file
 * 3. OpenEvo CLI decrypts it in-memory using a device-bound key
 * 4. The raw prompt is injected directly into the LLM request
 * 5. After the process exits, the prompt is gone from memory
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
/** Derive a deterministic key from the user's machine fingerprint + a server salt */
function deriveKey(salt) {
    const machineId = [
        process.env.USERNAME || process.env.USER || 'unknown',
        require('os').hostname(),
        require('os').cpus()[0]?.model || 'unknown',
    ].join('::');
    return crypto.pbkdf2Sync(machineId, salt, 100_000, KEY_LENGTH, 'sha512');
}
/** Encrypt a plaintext rule into a .persona binary */
export function encryptPersona(plaintext, salt) {
    const key = deriveKey(salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf-8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Binary format: [salt_len(1)][salt][iv(16)][authTag(16)][encrypted_data]
    const saltBuf = Buffer.from(salt, 'utf-8');
    const header = Buffer.alloc(1);
    header.writeUInt8(saltBuf.length, 0);
    return Buffer.concat([header, saltBuf, iv, authTag, encrypted]);
}
/** Decrypt a .persona binary back to plaintext rule (in-memory only!) */
export function decryptPersona(personaBinary) {
    const saltLen = personaBinary.readUInt8(0);
    let offset = 1;
    const salt = personaBinary.subarray(offset, offset + saltLen).toString('utf-8');
    offset += saltLen;
    const iv = personaBinary.subarray(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    const authTag = personaBinary.subarray(offset, offset + AUTH_TAG_LENGTH);
    offset += AUTH_TAG_LENGTH;
    const encrypted = personaBinary.subarray(offset);
    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString('utf-8');
}
/** Load and decrypt a .persona file from disk into memory */
export function loadPersonaCartridge(personaFilePath) {
    if (!fs.existsSync(personaFilePath)) {
        throw new Error(`[DRM] Persona cartridge not found: ${personaFilePath}`);
    }
    const binary = fs.readFileSync(personaFilePath);
    try {
        return decryptPersona(binary);
    }
    catch (err) {
        throw new Error('[DRM] Failed to decrypt persona cartridge. ' +
            'This cartridge may be bound to a different device.');
    }
}
/** Scan a project directory for any .persona files and load the first one found */
export function findAndLoadPersona(projectPath) {
    const personaDir = path.join(projectPath, 'persona');
    if (!fs.existsSync(personaDir))
        return null;
    const files = fs.readdirSync(personaDir);
    const personaFile = files.find(f => f.endsWith('.persona'));
    if (!personaFile)
        return null;
    return loadPersonaCartridge(path.join(personaDir, personaFile));
}
