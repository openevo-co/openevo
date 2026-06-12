import { Messenger } from '../../utils/messenger';
export class DaoyinTransfer {
    agentId;
    messenger;
    constructor(agentId) {
        this.agentId = agentId;
        this.messenger = new Messenger(agentId);
    }
    /** ถอดร่างและส่งไปให้ Agent ปลายทาง (เช่น 'henry') */
    async detachBodyAndTransfer(toAgentId, bodyData) {
        console.log(`[daoyin] Detaching body from ${this.agentId}...`);
        console.log(`[daoyin] Initiating body transfer to ${toAgentId}...`);
        const payload = {
            fromAgentId: this.agentId,
            body: bodyData
        };
        // ส่งผ่าน messenger RPC
        await this.messenger.send(toAgentId, 'transferBody', payload);
        console.log(`[daoyin] Body transfer protocol complete for target: ${toAgentId}.`);
    }
}
