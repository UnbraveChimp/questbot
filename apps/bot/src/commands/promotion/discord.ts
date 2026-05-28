import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';

export class DiscordCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('discord').setDescription('Get a link to the official Discord server!'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply(`${emojis.rightArrow1} https://duckorg.com/discord`);
	}
}
