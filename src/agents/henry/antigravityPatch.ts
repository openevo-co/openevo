// Mock Agent Base for compilation
export interface Agent {
    id: string;
    physics: { gravity: number };
    state: { isFloating: boolean };
    body: any;
}

import * as fs from 'fs';
import * as path from 'path';
import { Messenger } from '../../utils/messenger';

const CONFIG_PATH = path.resolve(__dirname, '../../../config/antigravity.json');

async function readConfig(configPath: string) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function writeConfig(configPath: string, data: any) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
}

export class HenryAntigravity {
  private agent: Agent;
  private messenger: Messenger;

  constructor(agent: Agent) {
    this.agent = agent;
    this.messenger = new Messenger(agent.id);
  }

  /** เปิดโหมด antigravity */
  async enable(options?: { gravity?: number }) {
    const cfg = await readConfig(CONFIG_PATH);
    cfg.enabled = true;
    cfg.gravity = options?.gravity ?? 0;
    await writeConfig(CONFIG_PATH, cfg);

    // ปรับ physics ของ henry
    this.agent.physics.gravity = cfg.gravity;
    this.agent.state.isFloating = true;

    console.log('[henry] antigravity enabled → gravity =', cfg.gravity);
  }

  /** ปิดโหมด antigravity (กลับสู่ธรรมดา) */
  async disable() {
    const cfg = await readConfig(CONFIG_PATH);
    cfg.enabled = false;
    cfg.gravity = 9.81; // ค่าเริ่มต้น
    await writeConfig(CONFIG_PATH, cfg);

    this.agent.physics.gravity = cfg.gravity;
    this.agent.state.isFloating = false;

    console.log('[henry] antigravity disabled → gravity =', cfg.gravity);
  }

  /** รับร่างจากดาวิน (called via messenger) */
  async receiveBody(payload: any) {
    // payload จะมีข้อมูล state & assets ของ “ร่าง” ที่ถูกถอด
    this.agent.body = payload.body; 
    console.log('[henry] received body from daoyin →', payload.body.id);
    
    // เริ่มทำงานต่อในโหมด antigravity (หรือปกติตาม cfg)
    if ((await readConfig(CONFIG_PATH)).enabled) {
      await this.enable();
    }
  }

  /** เริ่มสังเกตข้อความ RPC */
  listen() {
    this.messenger.on('transferBody', async (msg) => {
      await this.receiveBody(msg);
    });
    console.log('[henry] Listening for Daowin\'s body transfer on RPC...');
  }
}
