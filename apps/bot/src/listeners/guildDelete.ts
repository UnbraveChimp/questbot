import { prisma } from '@questbot/database';
import { Listener } from '@sapphire/framework';
import { EmbedBuilder, Events, type Guild } from 'discord.js';
import { forgetBlockedWords } from '#lib/automod.js';
import { forgetSettings } from '#lib/settings.js';

export class GuildDeleteListener extends Listener<typeof Events.GuildDelete> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, { ...options, event: Events.GuildDelete });
	}

	public async run(guild: Guild) {
		await prisma.server.delete({ where: { id: guild.id } }).catch(() => null);
		forgetSettings(guild.id);
		forgetBlockedWords(guild.id);

		const owner = await guild.client.users.fetch(guild.ownerId).catch(() => null);
		if (!owner) return;

		const embed = new EmbedBuilder()
			.setColor(0xffffff)
			.setTitle('Sorry to see you go!')
			.setDescription(
				`If you had any issues or feedback, feel free to join the support server by using the \`/discord\` command.\n\nWe'd also appreciate it if you could fill out our feedback form at https://vantern.org/feedback/questbot.`,
			);

		await owner.send({ embeds: [embed] }).catch(() => null);
	}
}
