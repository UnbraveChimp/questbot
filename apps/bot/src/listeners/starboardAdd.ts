// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Listener } from '@sapphire/framework';
import { Events, type MessageReaction, type PartialMessageReaction, type PartialUser, type User } from 'discord.js';
import { syncStarboard } from '#lib/starboard.js';

export class StarboardAddListener extends Listener<typeof Events.MessageReactionAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageReactionAdd,
		});
	}

	public async run(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
		await syncStarboard(reaction as MessageReaction, user).catch(() => {});
	}
}
