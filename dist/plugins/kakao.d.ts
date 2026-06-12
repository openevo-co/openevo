import { OpenEvoPlugin, MessagePayload } from './base.js';
export declare class KakaoPlugin implements OpenEvoPlugin {
    name: string;
    private restApiKey?;
    private messageCallback?;
    connect(config: Record<string, any>): Promise<void>;
    sendMessage(targetId: string, message: string): Promise<void>;
    onMessage(callback: (message: MessagePayload) => void): void;
    disconnect(): Promise<void>;
}
