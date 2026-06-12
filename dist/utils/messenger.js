import EventEmitter from 'events';
export class Messenger extends EventEmitter {
    agentId;
    constructor(agentId) {
        super();
        this.agentId = agentId;
    }
    /** ส่งข้อความภายใน cluster ของ agents */
    async send(toAgentId, type, payload) {
        // ในระบบจริงอาจใช้ Redis pub/sub หรือ websocket
        // ที่นี่ใช้ EventEmitter ตัวอย่างง่าย
        this.emit(`msg:${toAgentId}:${type}`, payload);
    }
    /** ฟังข้อความจาก agent อื่น */
    on(type, listener) {
        this.addListener(`msg:${this.agentId}:${type}`, listener);
    }
}
