// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Prisma, prisma } from '@questbot/database';

export async function setAfk(guildId: string, guildName: string, userId: string, message?: string) {
	await prisma.server.upsert({
		where: { id: guildId },
		create: { id: guildId, name: guildName },
		update: { name: guildName },
	});

	return prisma.afk.upsert({
		where: { guildId_userId: { guildId, userId } },
		create: { guildId, userId, message },
		update: { message: message ?? null, createdAt: new Date() },
	});
}

export async function getAfkForUsers(guildId: string, userIds: string[]) {
	if (userIds.length === 0) return [];
	return prisma.afk.findMany({ where: { guildId, userId: { in: userIds } } });
}

export async function consumeAfk(guildId: string, userId: string) {
	return prisma.afk.delete({ where: { guildId_userId: { guildId, userId } } }).catch((err: unknown) => {
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
		throw err;
	});
}

export async function removeAfk(guildId: string, userId: string) {
	return prisma.afk.deleteMany({ where: { guildId, userId } });
}
