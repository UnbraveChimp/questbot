import { Listener } from '@sapphire/framework';
import { type APIEmbedField, AuditLogEvent, type Channel, EmbedBuilder, Events } from 'discord.js';
import { removeConfessionContextsByChannel } from '#lib/confessions.js';
import { getRecentAuditLogEntry, isLoggingChannel, logEmbed } from '#lib/logging.js';

export class ChannelDeleteListener extends Listener<typeof Events.ChannelDelete> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.ChannelDelete,
		});
	}

	public async run(channel: Channel) {
		if (!('guild' in channel) || !channel.guild) return;

		await removeConfessionContextsByChannel(channel.id).catch(() => null);

		if (await isLoggingChannel(channel.guild, channel.id)) return;

		const channelLabel = channel.toString() || 'Unknown';
		const typeLabel = String(channel.type);
		const fields: APIEmbedField[] = [
			{ name: 'Channel', value: `${channelLabel} (${channel.id})`, inline: true },
			{ name: 'Type', value: typeLabel, inline: true },
		];

		const embed = new EmbedBuilder().setTitle('Channel Deleted').setColor(0xff6962).addFields(fields).setTimestamp();

		const auditEntry = await getRecentAuditLogEntry(channel.guild, AuditLogEvent.ChannelDelete, channel.id);

		if (auditEntry?.executor) {
			const moderatorLabel = String(auditEntry.executor.tag ?? auditEntry.executor.username ?? auditEntry.executor.id);
			embed.addFields({ name: 'Moderator', value: moderatorLabel, inline: true });
		}

		await logEmbed(channel.guild, embed);
	}
}
