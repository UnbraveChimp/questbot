// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AllFlowsPrecondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';
import { getModeratorIds } from '#lib/confessions.js';

export class globalModeratorPrecondition extends AllFlowsPrecondition {
	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		return this.check(interaction.user.id);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.check(interaction.user.id);
	}

	public override messageRun(message: Message) {
		return this.check(message.author.id);
	}

	private check(userId: string) {
		return getModeratorIds().includes(userId)
			? this.ok()
			: this.error({ message: 'This command is restricted to bot moderators.' });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		globalModerator: never;
	}
}
