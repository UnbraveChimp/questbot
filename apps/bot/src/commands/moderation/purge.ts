import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';
import { MessageFlags, PermissionsBitField } from 'discord.js';

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

export class PurgeCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: any) =>
			builder
				.setName('purge')
				.setDescription('Purge messages from a channel.')
				.addIntegerOption((option: any) =>
					option
						.setName('amount')
						.setDescription('The number of messages to purge')
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(1000),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				content: `${emojis.rightArrow2} This command can only be used in a server.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const member = interaction.member;
		const channel = interaction.channel;

		if (!channel || !('messages' in channel)) {
			await interaction.reply({
				content: `${emojis.rightArrow2} Unable to access channel messages.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!member || !('permissions' in member) || !channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageMessages)) {
			await interaction.reply({
				content: `${emojis.rightArrow2} You do not have permission to manage messages.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const amount = interaction.options.getInteger('amount') ?? 0;
		if (amount <= 0) {
			await interaction.reply({
				content: `${emojis.rightArrow2} Please provide a valid number of messages to purge.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		await interaction.editReply(`${emojis.rightArrow2} Purging ${amount} messages...`);

		let remaining = amount;
		let deletedTotal = 0;

		try {
			while (remaining > 0) {
				const fetchLimit = Math.min(remaining, 100);
				const fetched = await channel.messages.fetch({ limit: fetchLimit as number });
				if (!fetched.size) break;

				const now = Date.now();
				const recentMessages = fetched.filter((message: any) => now - message.createdTimestamp < FOURTEEN_DAYS);
				const oldMessages = fetched.filter((message: any) => now - message.createdTimestamp >= FOURTEEN_DAYS);

				if (recentMessages.size) {
					const deleted = await channel.bulkDelete(recentMessages, true);
					deletedTotal += deleted.size;
					remaining -= deleted.size;
				}

				if (oldMessages.size && remaining > 0) {
					const messagesToDelete = oldMessages.first(Math.min(oldMessages.size, remaining));

					for (const message of messagesToDelete) {
						try {
							await channel.messages.delete(message.id);
							deletedTotal += 1;
							remaining -= 1;
						} catch (err) {
							console.error('Failed to delete old message', err);
						}

						if (remaining <= 0) break;
					}
				}

				await interaction.editReply(`${emojis.rightArrow2} Purging messages... deleted ${deletedTotal}/${amount}`);

				if (recentMessages.size === 0 && oldMessages.size === 0) break;
			}

			await interaction.editReply(`${emojis.rightArrow1} Successfully purged ${deletedTotal} messages.`);
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				content: `${emojis.rightArrow2} An error occurred while trying to purge messages.`,
			});
		}
	}
}
