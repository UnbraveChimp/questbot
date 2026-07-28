import { prisma } from '@questbot/database';
import { LIMITS_ENABLED, LimitError } from './limits.js';

export class DuplicateAutoModError extends Error {
	public constructor() {
		super('That word is already blocked in this server.');
		this.name = 'DuplicateAutoModError';
	}
}

const blockedWordsCache = new Map<string, { words: string[]; expiresAt: number }>();

async function getBlockedWords(guildId: string): Promise<string[]> {
	const cached = blockedWordsCache.get(guildId);
	if (cached && cached.expiresAt > Date.now()) return cached.words;

	const rows = await prisma.autoMod.findMany({ where: { guildId }, select: { word: true } });
	const words = rows.map((row) => row.word.trim().toLowerCase()).filter(Boolean);

	blockedWordsCache.set(guildId, { words, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min ttl

	return words;
}

export function forgetBlockedWords(guildId: string): void {
	blockedWordsCache.delete(guildId);
}

export async function createAutoMod(guildId: string, guildName: string, word: string) {
	if (!word?.trim()) {
		throw new Error('Automod word cannot be empty.');
	}

	if (LIMITS_ENABLED) {
		const autoModCount = await prisma.autoMod.count({ where: { guildId } });

		if (autoModCount >= 20) {
			throw new LimitError('A guild can only have up to 20 automod rules.');
		}
	}

	if (guildId && guildName) {
		await prisma.server.upsert({
			where: { id: guildId },
			create: { id: guildId, name: guildName },
			update: { name: guildName },
		});
	}

	try {
		const created = await prisma.autoMod.create({
			data: { guildId, word },
		});
		blockedWordsCache.delete(guildId);

		return created;
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
	const words = await getBlockedWords(guildId);
	if (words.length === 0) return false;

	const lowerText = text.toLowerCase();
	return words.some((word) => lowerText.includes(word));
}

export async function removeAutoMod(autoModId: string) {
	const removed = await prisma.autoMod.delete({ where: { id: autoModId } });
	blockedWordsCache.delete(removed.guildId);

	return removed;
}

export async function clearAutoMods(guildId: string) {
	const removed = await prisma.autoMod.deleteMany({ where: { guildId } });
	blockedWordsCache.delete(guildId);

	return removed;
}

export async function getAutoMod(autoModId: string) {
	return prisma.autoMod.findUnique({ where: { id: autoModId } });
}
