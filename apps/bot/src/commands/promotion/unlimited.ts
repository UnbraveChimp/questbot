import { Command } from '@sapphire/framework';
import { getQuestUnlimitedPurchaseComponents, hasQuestUnlimitedAccess } from '#lib/limits.js';
import { MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { infoEmbed, successEmbed } from '#utils/embeds.js';

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
		if (interaction.guildId) {
			const hasUnlimited = await hasQuestUnlimitedAccess(
				interaction.client.application.entitlements,
				interaction.guildId,
			);

			if (hasUnlimited) {
				await interaction.reply({
					embeds: [successEmbed(`${emojis.questUnlimited2} This server already has Quest Unlimited!`)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}

		await interaction.reply({
			embeds: [infoEmbed(`${emojis.questUnlimited2} Purchase Quest Unlimited below:`)],
			components: getQuestUnlimitedPurchaseComponents(interaction.client.application.id),
			flags: MessageFlags.Ephemeral,
		});
	}
}
