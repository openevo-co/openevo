export interface MessagePayload {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  raw: any;
}

export interface OpenEvoPlugin {
  name: string;
  connect(config: Record<string, any>): Promise<void>;
  sendMessage(targetId: string, message: string): Promise<void>;
  onMessage(callback: (message: MessagePayload) => void): void;
  disconnect(): Promise<void>;
}
