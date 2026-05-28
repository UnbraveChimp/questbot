import { prisma } from '@questbot/database';
import { hasQuestUnlimitedAccess, LIMITS_ENABLED, LimitError } from './limits.js';
import type { EntitlementManager } from 'discord.js';

export async function createAutoRole(
	guildId: string,
	guildName: string,
	roleId: string,
	botRole?: boolean,
	entitlements?: EntitlementManager,
) {
	const hasUnlimitedAccess = entitlements ? await hasQuestUnlimitedAccess(entitlements, guildId) : false;

	if (LIMITS_ENABLED && !hasUnlimitedAccess) {
		const autoRoleCount = await prisma.autoRole.count({ where: { guildId } });

		if (autoRoleCount >= 5) {
			throw new LimitError('A guild can only have up to 5 auto roles.', true);
		}
	}

	if (guildId && guildName) {
		await prisma.server.upsert({
			where: { id: guildId },
			create: { id: guildId, name: guildName },
			update: { name: guildName },
		});
	}

	return prisma.autoRole.upsert({
		where: {
			guildId_roleId: {
				guildId,
				roleId,
			},
		},
		create: {
			guildId,
			roleId,
			botRole,
		},
		update: {
			botRole,
		},
	});
}

export async function getAutoRoles(guildId: string) {
	return prisma.autoRole.findMany({
		where: { guildId },
		orderBy: { createdAt: 'asc' },
	});
}

export async function removeAutoRole(autoRoleId: string) {
	return prisma.autoRole.delete({ where: { id: autoRoleId } });
}

export async function clearAutoRoles(guildId: string) {
	return prisma.autoRole.deleteMany({ where: { guildId } });
}

export async function getAutoRole(autoRoleId: string) {
	return prisma.autoRole.findUnique({ where: { id: autoRoleId } });
}
