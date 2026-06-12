export interface Agent {
    id: string;
    physics: {
        gravity: number;
    };
    state: {
        isFloating: boolean;
    };
    body: any;
}
export declare class HenryAntigravity {
    private agent;
    private messenger;
    constructor(agent: Agent);
    /** เปิดโหมด antigravity */
    enable(options?: {
        gravity?: number;
    }): Promise<void>;
    /** ปิดโหมด antigravity (กลับสู่ธรรมดา) */
    disable(): Promise<void>;
    /** รับร่างจากดาวิน (called via messenger) */
    receiveBody(payload: any): Promise<void>;
    /** เริ่มสังเกตข้อความ RPC */
    listen(): void;
}
