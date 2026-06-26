import EventEmitter from 'events';

export class Messenger extends EventEmitter {
  constructor(public agentId: string) {
    super();
  }

  /** ส่งข้อความภายใน cluster ของ agents */
  async send(toAgentId: string, type: string, payload: any) {
    // ในระบบจริงอาจใช้ Redis pub/sub หรือ websocket
    // ที่นี่ใช้ EventEmitter ตัวอย่างง่าย
    this.emit(`msg:${toAgentId}:${type}`, payload);
  }

  /** ฟังข้อความจาก agent อื่น */
  onMessage(type: string, listener: (msg: any) => void) {
    this.addListener(`msg:${this.agentId}:${type}`, listener);
  }
}
