import { prisma } from '@questbot/database';

export type ConfessionContext = {
	guildId: string;
	channelId: string;
	messageId: string;
	threadId: string;
	creatorId?: string;
};

export function getModeratorIds() {
	return [
		...new Set(
			(process.env.MODERATORS ?? '')
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean),
		),
	];
}

export function buildConfessionLink(guildId: string, channelId: string, messageId: string) {
	return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

export async function storeConfessionContext(context: ConfessionContext) {
	await prisma.confession.upsert({
		where: { messageId: context.messageId },
		create: context,
		update: context,
	});
}

export async function getConfessionContext(messageId: string) {
	return prisma.confession.findUnique({
		where: { messageId },
		select: {
			guildId: true,
			channelId: true,
			messageId: true,
			threadId: true,
			creatorId: true,
		},
	});
}

export async function removeConfessionContext(messageId: string) {
	await prisma.confession.deleteMany({
		where: { messageId },
	});
}

export async function removeConfessionContexts(messageIds: string[]) {
	if (messageIds.length === 0) return;

	await prisma.confession.deleteMany({
		where: {
			messageId: {
				in: messageIds,
			},
		},
	});
}

export async function removeConfessionContextsByChannel(channelId: string) {
	await prisma.confession.deleteMany({
		where: { channelId },
	});
}

export async function isConfessionBlacklisted(userId: string) {
	return prisma.confessionBlacklist.findUnique({ where: { userId } });
}

export async function addConfessionBlacklist(userId: string, createdBy: string, reason?: string) {
	return prisma.confessionBlacklist.upsert({
		where: { userId },
		create: { userId, createdBy, reason },
		update: { createdBy, reason },
	});
}

export async function removeConfessionBlacklist(userId: string) {
	return prisma.confessionBlacklist.deleteMany({ where: { userId } });
}
