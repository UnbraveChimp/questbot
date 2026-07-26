import { prisma } from '@questbot/database';
import type { EntitlementManager } from 'discord.js';
import { hasQuestUnlimitedAccess, LIMITS_ENABLED, LimitError } from './limits.js';

export class DuplicateAutoModError extends Error {
	public constructor() {
		super('That word is already blocked in this server.');
		this.name = 'DuplicateAutoModError';
	}
}

export async function createAutoMod(
	guildId: string,
	guildName: string,
	word: string,
	entitlements?: EntitlementManager,
) {
	if (!word?.trim()) {
		throw new Error('Automod word cannot be empty.');
	}

	const hasUnlimitedAccess = entitlements ? await hasQuestUnlimitedAccess(entitlements, guildId) : false;

	if (LIMITS_ENABLED) {
		const autoModCount = await prisma.autoMod.count({ where: { guildId } });

		if (autoModCount >= 10 && !hasUnlimitedAccess) {
			throw new LimitError('A guild can only have up to 10 automod rules.', true);
		}

		if (autoModCount >= 250 && hasUnlimitedAccess) {
			throw new LimitError(
				'A guild with unlimited access can only have up to 250 automod rules. This is to combat abuse.',
			);
		}
	}

	if (guildId && guildName) {
		await prisma.server.upsert({
			where: { id: guildId },
			create: { id: guildId, name: guildName },
			update: { name: guildName },
		});

		try {
			return await prisma.autoMod.create({
				data: { guildId, word },
			});
		} catch (error) {
			if ((error as { code?: string }).code === 'P2002') {
				throw new DuplicateAutoModError();
			}

			throw error;
		}
	}

	try {
		return await prisma.autoMod.create({
			data: { guildId, word },
		});
	} catch (error) {
		if ((error as { code?: string }).code === 'P2002') {
			throw new DuplicateAutoModError();
		}

		throw error;
	}
}

export async function getAutoMods(guildId: string) {
	return prisma.autoMod.findMany({
		where: { guildId },
		orderBy: { createdAt: 'asc' },
	});
}

export async function containsBlockedWord(guildId: string, text: string): Promise<boolean> {
	const autoMods = await getAutoMods(guildId);
	const lowerText = text.toLowerCase();
	return autoMods.some((autoMod) => autoMod.word.trim() && lowerText.includes(autoMod.word.toLowerCase()));
}

export async function removeAutoMod(autoModId: string) {
	return prisma.autoMod.delete({ where: { id: autoModId } });
}

export async function clearAutoMods(guildId: string) {
	return prisma.autoMod.deleteMany({ where: { guildId } });
}

export async function getAutoMod(autoModId: string) {
	return prisma.autoMod.findUnique({ where: { id: autoModId } });
}
