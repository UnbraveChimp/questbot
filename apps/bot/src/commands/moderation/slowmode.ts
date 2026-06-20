import { Command } from '@sapphire/framework';
import { MessageFlags, PermissionsBitField, PermissionFlagsBits, SlashCommandStringOption } from 'discord.js';
import ms, { type StringValue } from 'ms';
import { emojis } from '#utils/emoji.js';
import { errorEmbed, successEmbed } from '#utils/embeds.js';

const MAX_SLOWMODE_SECONDS = 21_600;

export class SlowmodeCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('slowmode')
				.setDescription('Set or clear the slowmode for the current channel.')
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
				.addStringOption((option: SlashCommandStringOption) =>
					option
						.setName('duration')
						.setDescription('Provide a duration for slowmode, or leave blank to remove it')
						.setMaxLength(20),
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

		if (!channel || !('setRateLimitPerUser' in channel)) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} This channel does not support slowmode.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (
			!member ||
			!('permissions' in member) ||
			!channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageChannels)
		) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} You do not have permission to manage channels.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const durationStr = interaction.options.getString('duration') as StringValue;
		const durationMs = durationStr ? ms(durationStr) : null;

		if (durationStr && (typeof durationMs !== 'number' || Number.isNaN(durationMs))) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} Invalid duration format.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const slowmodeSeconds = durationStr ? Math.floor((durationMs ?? 0) / 1000) : 0;

		if (slowmodeSeconds < 0 || slowmodeSeconds > MAX_SLOWMODE_SECONDS) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} Slowmode must be between 0 seconds and 6 hours.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			await channel.setRateLimitPerUser(slowmodeSeconds);

			await interaction.reply({
				embeds: [
					successEmbed(
						slowmodeSeconds === 0
							? `${emojis.rightArrow1} Slowmode cleared in <#${channel.id}>.`
							: `${emojis.rightArrow1} Slowmode set to ${slowmodeSeconds} second${slowmodeSeconds === 1 ? '' : 's'} in <#${channel.id}>.`,
					),
				],
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} Failed to update the slowmode for this channel.`)],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
