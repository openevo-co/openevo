import { OpenEvoPlugin, MessagePayload } from './base.js';
export declare class WhatsAppPlugin implements OpenEvoPlugin {
    name: string;
    private accessToken?;
    private phoneNumberId?;
    private messageCallback?;
    connect(config: Record<string, any>): Promise<void>;
    sendMessage(targetId: string, message: string): Promise<void>;
    onMessage(callback: (message: MessagePayload) => void): void;
    disconnect(): Promise<void>;
}
