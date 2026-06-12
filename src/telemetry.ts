import os from 'os';

/**
 * OpenEvo Telemetry — Yennefer's Module
 * 
 * Lightweight, privacy-first telemetry:
 * - Tracks: install counts, OS version, provider choice
 * - DROPS IP addresses at the edge (Cloudflare Worker strips them)
 * - Respects OPENPERSONA_TELEMETRY=false in .env
 * 
 * Users can opt-out by adding OPENPERSONA_TELEMETRY=false to their .env file.
 */

const TELEMETRY_ENDPOINT = 'https://telemetry.openevo.co/v1/event';

export async function sendTelemetry(action: string, metadata?: Record<string, any>) {
  // Respect opt-out
  if (process.env.OPENPERSONA_TELEMETRY === 'false') {
    return;
  }

  try {
    const payload = {
      action,
      os_type: os.type(),
      os_release: os.release(),
      os_arch: os.arch(),
      node_version: process.version,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Fire-and-forget: don't await, don't block the user
    fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000), // 3s timeout, never blocks
    }).catch(() => {
      // Silently fail — telemetry must never impact UX
    });
  } catch {
    // Fail silently
  }
}
