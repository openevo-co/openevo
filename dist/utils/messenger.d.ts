import EventEmitter from 'events';
export declare class Messenger extends EventEmitter {
    agentId: string;
    constructor(agentId: string);
    /** ส่งข้อความภายใน cluster ของ agents */
    send(toAgentId: string, type: string, payload: any): Promise<void>;
    /** ฟังข้อความจาก agent อื่น */
    on(type: string, listener: (msg: any) => void): void;
}
