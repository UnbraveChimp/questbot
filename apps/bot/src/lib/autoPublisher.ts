import { type Message, MessageFlags } from 'discord.js';

const crosspostWindows = new Map<string, { count: number; resetAt: number }>();

export async function autoPublish(message: Message): Promise<void> {
	if (!message.crosspostable) return;

	if (message.flags.has(MessageFlags.IsCrosspost)) return;

	const now = Date.now();
	const existing = crosspostWindows.get(message.channel.id);
	const window = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + 60 * 60 * 1000 }; // 1h

	if (window.count >= 10) return;

	crosspostWindows.set(message.channel.id, { ...window, count: window.count + 1 });

	try {
		await message.crosspost();
	} catch (err) {
		console.error(err);
	}
}
