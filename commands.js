"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const config_1 = tslib_1.__importDefault(require("./config"));
const { prefix } = config_1.default;
const commands = {
    'help': {
        description: 'Shows the list of commands and their details.',
        format: 'help'
    },
    'clockin': {
      description: 'Clock on for duty.',
      format: 'clockin'
    },
    'clockout': {
        description: 'Clock off of duty',
        format: 'clockout'
    },
    'clockedin': {
        description: 'See who is clockedin',
        format: 'clockedin'
    },
    'data': {
        description: 'See your total time since the last reset.',
        format: 'data'
    },
    'data all': {
        description: 'Receive a DM of data for everyone in the server. Requires "Manager Server" permission',
        format: 'data all'
    },
    'force': {
        description: 'Force a user to clock in or out. Requires "Manage Server" permission.',
        format: 'force [clockin/clockout] [user]'
    },
    'add': {
        description: 'Add time to a user. Requires "Manage Server" permission. You can use negative numbers to subtract time.',
        format: 'add [user] [time in minutes]'
    },
    'clear': {
        description: 'Permanently delete data for everyone in the server. Requires "Manage Server" permission.',
        format: 'clear'
    }
};
function helpCommand(message) {
    const footerText = message.author.tag;
    const footerIcon = message.author.displayAvatarURL();
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('HELP MENU')
        .setColor('Blurple')
        .setFooter({ text: footerText, iconURL: footerIcon });
    for (const commandName of Object.keys(commands)) {
        const command = commands[commandName];
        let desc = command.description + '\n';
        if (command.aliases)
            desc += `**Aliases :** ${command.aliases.join(', ')}\n\n`;
        desc += '*Format* ```' + prefix + command.format + '```';
        embed.addFields({name: `${commandName}`, value: desc, inline: false});
    }
    return embed;
}
exports.default = helpCommand;
//# sourceMappingURL=commands.js.map