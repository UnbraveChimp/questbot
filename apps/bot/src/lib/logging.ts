import type { AuditLogEvent, EmbedBuilder, Guild } from 'discord.js';
import { getSettings } from '#lib/settings.js';

export async function logEmbed(guild: Guild, embed: EmbedBuilder) {
	const settings = await getSettings(guild.id).catch((err) => {
		console.error(err);
		return null;
	});

	if (!settings?.loggingEnabled || !settings.loggingChannelId) return;

	const channel = await guild.channels.fetch(settings.loggingChannelId).catch(() => null);
	if (!channel?.isTextBased() || !channel.isSendable()) return;

	await channel.send({ embeds: [embed] }).catch((err) => console.error(err));
}

export async function isLoggingChannel(guild: Guild, channelId: string | null | undefined) {
	if (!channelId) return false;

	const settings = await getSettings(guild.id).catch((err) => {
		console.error(err);
		return null;
	});

	return settings?.loggingEnabled && settings.loggingChannelId === channelId;
}

export async function getRecentAuditLogEntry(guild: Guild, type: AuditLogEvent, targetId: string) {
	const auditLogs = await guild.fetchAuditLogs({ type, limit: 5 }).catch((err) => {
		if (err?.code !== 10004) console.error(err);
		return null;
	});

	if (!auditLogs) return null;

	return (
		auditLogs.entries.find((entry) => entry.targetId === targetId && Date.now() - entry.createdTimestamp < 5_000) ??
		null
	);
}

export function truncate(text: string | null | undefined, length = 1900) {
	if (!text) return '';
	return text.length > length ? `${text.slice(0, length)}…` : text;
}
