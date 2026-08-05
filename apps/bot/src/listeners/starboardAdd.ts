import { Listener } from '@sapphire/framework';
import { Events, type MessageReaction, type PartialMessageReaction } from 'discord.js';
import { syncStarboard } from '#lib/starboard.js';

export class StarboardAddListener extends Listener<typeof Events.MessageReactionAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageReactionAdd,
		});
	}

	public async run(reaction: MessageReaction | PartialMessageReaction) {
		await syncStarboard(reaction as MessageReaction).catch(() => {});
	}
}
