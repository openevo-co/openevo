export class DiscordPlugin {
    name = 'discord';
    botToken;
    messageCallback;
    async connect(config) {
        this.botToken = config.botToken;
        console.log(`[Discord] Connecting to gateway...`);
        // TODO: Initialize discord.js client
    }
    async sendMessage(targetId, message) {
        console.log(`[Discord] Sending message to channel/user ${targetId}: ${message}`);
        // TODO: discord.js send message
    }
    onMessage(callback) {
        this.messageCallback = callback;
        console.log(`[Discord] Listening to messageCreate events.`);
    }
    async disconnect() {
        console.log(`[Discord] Disconnected.`);
    }
}
