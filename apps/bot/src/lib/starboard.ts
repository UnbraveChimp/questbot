// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { prisma } from '@questbot/database';
import { EmbedBuilder, type Message, type MessageReaction } from 'discord.js';
import { truncate } from '#lib/logging.js';
import { getSettings } from '#lib/settings.js';
import { Colors } from '#utils/embeds.js';
import { getChannel } from '#utils/getChannel.js';

function normalize(emoji: string | null | undefined): string {
	return (emoji ?? '').replace(/️/g, '');
}

function reactionEmoji(reaction: MessageReaction): string {
	return reaction.emoji.id ? reaction.emoji.toString() : (reaction.emoji.name ?? '');
}

function buildStarboardMessage(message: Message<true>, emoji: string, count: number) {
	const image = [...message.attachments.values()].find((attachment) => attachment.contentType?.startsWith('image/'));

	const embed = new EmbedBuilder()
		.setColor(Colors.info)
		.setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
		.setDescription(truncate(message.content, 4096) || null)
		.addFields({ name: 'Source', value: `${message.url}` })
		.setFooter({ text: `ID: ${message.id}` })
		.setTimestamp(message.createdAt);

	if (image) embed.setImage(image.url);

	return {
		content: `${emoji} | **${count}**`,
		embeds: [embed],
		allowedMentions: { parse: [] },
	};
}

export async function getStarboardEntry(messageId: string) {
	return prisma.starboard.findUnique({ where: { messageId } });
}

export async function removeStarboardEntry(messageId: string) {
	await prisma.starboard.deleteMany({ where: { messageId } });
}

export async function removeStarboardEntriesByChannel(channelId: string) {
	await prisma.starboard.deleteMany({ where: { channelId } });
}

export async function syncStarboard(reaction: MessageReaction): Promise<void> {
	const full = reaction.partial ? await reaction.fetch().catch(() => null) : reaction;
	if (!full) return;

	const message = full.message.partial ? await full.message.fetch().catch(() => null) : full.message;
	if (!message?.inGuild()) return;

	const settings = await getSettings(message.guildId);
	if (!settings.starboardEnable || !settings.starboardChannelId) return;

	if (message.author.id === message.client.user.id && message.channelId === settings.starboardChannelId) return; //* don't post our own messages from the starboard channel but allow other users to be posted from the starboard channel
	if (normalize(reactionEmoji(full)) !== normalize(settings.starboardEmoji)) return;

	const emoji = settings.starboardEmoji ?? reactionEmoji(full);
	const count = full.count ?? 0;
	const entry = await getStarboardEntry(message.id);

	const channel = await getChannel(message.client.channels, settings.starboardChannelId);
	if (!channel?.isTextBased() || !channel.isSendable()) return;

	if (count < settings.starboardRequirement) {
		if (!entry) return;

		const posted = await channel.messages.fetch(entry.starboardMessageId).catch(() => null);
		await posted?.delete().catch(() => {});
		await removeStarboardEntry(message.id);

		return;
	}

	const payload = buildStarboardMessage(message, emoji, count);

	if (entry) {
		const posted = await channel.messages.fetch(entry.starboardMessageId).catch(() => null);

		if (posted) {
			await posted.edit(payload).catch(() => {});
			return;
		}

		await removeStarboardEntry(message.id);
	}

	const posted = await channel.send(payload).catch(() => null);
	if (!posted) return;

	await prisma.starboard.create({
		data: {
			messageId: message.id,
			guildId: message.guildId,
			channelId: message.channelId,
			starboardMessageId: posted.id,
		},
	});
}
