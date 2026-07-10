import { Listener } from '@sapphire/framework';
import { Events, type Message } from 'discord.js';
import { consumeAfk, getAfkForUsers } from '#lib/afk.js';

export class AfkListener extends Listener<typeof Events.MessageCreate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageCreate,
		});
	}

	public async run(message: Message) {
		if (!message.inGuild() || message.author.bot) return;

		await this.memberReturn(message);
		await this.afkMention(message);
	}

	private async memberReturn(message: Message<true>) {
		const afk = await consumeAfk(message.guild.id, message.author.id);
		if (!afk) return;

		await message
			.reply({
				content: `Welcome back, <@${message.author.id}>! I've removed your AFK status.`,
				allowedMentions: { parse: [], users: [message.author.id] },
			})
			.catch((err) => console.error(err));
	}

	private async afkMention(message: Message<true>) {
		const mentionedUserIds = [...message.mentions.users.keys()].filter((id) => id !== message.author.id);
		if (mentionedUserIds.length === 0) return;

		const afkUsers = await getAfkForUsers(message.guild.id, mentionedUserIds);
		if (afkUsers.length === 0) return;

		const lines = afkUsers.map((afk) => `<@${afk.userId}> is AFK${afk.message ? `: ${afk.message}` : '.'}`);

		await message
			.reply({
				content: lines.join('\n'),
				allowedMentions: { parse: [], users: afkUsers.map((afk) => afk.userId) },
			})
			.catch((err) => console.error(err));
	}
}
