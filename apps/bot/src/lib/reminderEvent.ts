import type { Prisma } from '@questbot/database';
import type { Client } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { startShardedPoller } from '#utils/sharding.js';
import { getDueReminders, removeReminder } from './reminders.js';

export function reminderScheduler(client: Client) {
	startShardedPoller({
		client,
		getDue: getDueReminders,
		// each shard handles its reminders for its own guild
		getOwnerKey: (reminder) => reminder.guildId ?? reminder.userId,
		handle: (reminder) => handleReminder(client, reminder),
	});
}

async function handleReminder(client: Client, reminder: Prisma.ReminderModel) {
	let sent = false;
	if (reminder.channelId) {
		const channel = client.channels.cache.get(reminder.channelId);
		if (channel?.isSendable()) {
			await channel.send({
				content: `${emojis.rightArrow2} <@${reminder.userId}> reminder: ${reminder.message ?? 'No message provided'}`,
				allowedMentions: { users: [reminder.userId] },
			});
			sent = true;
		}
	}
	if (!sent) {
		await dmUser(client, reminder.userId, reminder.message);
	}

	await removeReminder(reminder.id);
}

async function dmUser(client: Client, userId: string, message: string) {
	const user = await client.users.fetch(userId).catch(() => null);
	if (!user) return;

	await user
		.send({
			content: `${emojis.rightArrow2} <@${userId}> reminder: ${message}`,
			allowedMentions: { users: [userId] },
		})
		.catch(() => {});
}
