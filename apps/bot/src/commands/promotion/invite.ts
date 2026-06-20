import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';
import { infoEmbed } from '#utils/embeds.js';

export class InviteCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('invite').setDescription('Get a link to add the bot to your server!'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({ embeds: [infoEmbed(`${emojis.rightArrow1} https://duckorg.com/bot/invite`)] });
	}
}
