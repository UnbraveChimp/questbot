import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';
import { EmbedBuilder, MessageFlags, PermissionsBitField, Routes, SlashCommandIntegerOption } from 'discord.js';
import { errorEmbed, infoEmbed, successEmbed } from '#utils/embeds.js';
import { logEmbed } from '#lib/logging.js';

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
			const messages = await channel.messages.fetch({ limit: amount });
			const messageIds = [...messages.keys()];

			if (messageIds.length === 1) {
				await channel.client.rest.delete(Routes.channelMessage(channel.id, messageIds[0]));
			} else if (messageIds.length > 1) {
				await channel.client.rest.post(Routes.channelBulkDelete(channel.id), { body: { messages: messageIds } });
			}

			const logEntry = new EmbedBuilder()
				.setTitle('Purged')
				.setColor(0xff6962)
				.addFields(
					{ name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
					{ name: 'Channel', value: channel.toString(), inline: true },
					{ name: 'Count', value: `${messageIds.length}`, inline: true },
				)
				.setTimestamp();

			await logEmbed(interaction.guild, logEntry);

			await interaction.editReply({
				embeds: [successEmbed(`${emojis.rightArrow1} Successfully purged ${messageIds.length} messages.`)],
			});
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				embeds: [errorEmbed(`${emojis.rightArrow2} An error occurred while trying to purge messages.`)],
			});
		}
	}
}
