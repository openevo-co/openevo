export declare class DaoyinTransfer {
    agentId: string;
    private messenger;
    constructor(agentId: string);
    /** ถอดร่างและส่งไปให้ Agent ปลายทาง (เช่น 'henry') */
    detachBodyAndTransfer(toAgentId: string, bodyData: any): Promise<void>;
}
