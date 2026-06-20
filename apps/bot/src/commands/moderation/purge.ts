import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';
import { MessageFlags, PermissionsBitField, SlashCommandIntegerOption } from 'discord.js';
import { errorEmbed, infoEmbed, successEmbed } from '#utils/embeds.js';

export class PurgeCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('purge')
				.setDescription('Purge messages up to 14d old from a channel.')
				.addIntegerOption((option: SlashCommandIntegerOption) =>
					option
						.setName('amount')
						.setDescription('The number of messages to purge')
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} This command can only be used in a server.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const member = interaction.member;
		const channel = interaction.channel;

		if (!channel || !('messages' in channel)) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} Unable to access channel messages.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (
			!member ||
			!('permissions' in member) ||
			!channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageMessages)
		) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} You do not have permission to manage messages.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const amount = interaction.options.getInteger('amount') ?? 0;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		await interaction.editReply({ embeds: [infoEmbed(`${emojis.rightArrow2} Purging ${amount} messages...`)] });

		try {
			await channel.bulkDelete(amount);

			await interaction.editReply({
				embeds: [successEmbed(`${emojis.rightArrow1} Successfully purged ${amount} messages.`)],
			});
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				embeds: [errorEmbed(`${emojis.rightArrow2} An error occurred while trying to purge messages.`)],
			});
		}
	}
}
