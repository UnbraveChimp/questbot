import { type Message, MessageFlags } from 'discord.js';

export async function autoPublish(message: Message): Promise<void> {
	if (!message.crosspostable) return;

	if (message.flags.has(MessageFlags.IsCrosspost)) return;

	await message.crosspost();
}
