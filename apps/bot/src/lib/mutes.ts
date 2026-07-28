import { Prisma, prisma } from '@questbot/database';
import type { Guild } from 'discord.js';
import { type ShardInfo, shardOwns } from '#utils/sharding.js';

export async function createMute(
	guildId: string,
	guildName: string,
	userId: string,
	expiresAt: Date | null,
	reason?: string,
) {
	await prisma.server.upsert({
		where: { id: guildId },
		create: { id: guildId, name: guildName },
		update: { name: guildName },
	});
	return prisma.mute.upsert({
		where: { guildId_userId: { guildId, userId } },
		create: { guildId, userId, expiresAt, reason },
		update: { expiresAt, reason },
	});
}

export async function removeMute(guildId: string, userId: string) {
	return prisma.mute.deleteMany({
		where: { guildId, userId },
	});
}

export async function getMute(guildId: string, userId: string) {
	return prisma.mute.findUnique({
		where: { guildId_userId: { guildId, userId } },
	});
}

export async function getActiveMutes(shard: ShardInfo) {
	return prisma.$queryRaw<Prisma.MuteModel[]>`
		SELECT * FROM "Mute"
		WHERE ("expiresAt" IS NULL OR "expiresAt" > ${new Date()})
			AND ${shardOwns(Prisma.sql`"guildId"::bigint`, shard)}
	`;
}

export async function enforceMute(guild: Guild, userId: string): Promise<boolean> {
	const mute = await getMute(guild.id, userId);
	if (!mute) return false;

	if (mute.expiresAt !== null && mute.expiresAt <= new Date()) {
		await removeMute(guild.id, userId);
		return false;
	}

	const member = await guild.members.fetch(userId).catch(() => null);
	if (!member?.moderatable) return false;

	const remaining = mute.expiresAt ? Math.min(mute.expiresAt.getTime() - Date.now(), 2419200000) : 2419200000;

	await member.timeout(remaining, mute.reason ?? '').catch(() => {});
	return true;
}
