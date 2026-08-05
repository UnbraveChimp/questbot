// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Listener } from '@sapphire/framework';
import { Events, type Message } from 'discord.js';
import { getSticky, repostSticky } from '#lib/sticky.js';

export class StickyListener extends Listener<typeof Events.MessageCreate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageCreate,
		});
	}

	public async run(message: Message) {
		if (!message.inGuild()) return;

		if (message.author.id === message.client.user.id) return; // don't repost on our own message

		const sticky = await getSticky(message.guild.id, message.channel.id);
		if (!sticky) return;

		await repostSticky(message.channel, sticky);
	}
}
