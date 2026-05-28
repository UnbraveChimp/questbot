import { Command } from '@sapphire/framework';
import { getQuestUnlimitedPurchaseComponents } from '#lib/limits.js';
import { MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';

export class QuestUnlimitedCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('unlimited').setDescription('Purchase Quest Unlimited!'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({
			content: `${emojis.questUnlimited2} Purchase Quest Unlimited below:`,
			components: getQuestUnlimitedPurchaseComponents(interaction.client.application.id),
			flags: MessageFlags.Ephemeral,
		});
	}
}
