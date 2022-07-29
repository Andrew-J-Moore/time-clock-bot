"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const {discord_js_1, GatewayIntentBits} = require("discord.js");
exports.default = {
    prefix: '$',
    token: process.env.token,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
};
//# sourceMappingURL=config.js.map