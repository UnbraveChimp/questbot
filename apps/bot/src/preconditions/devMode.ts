// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

const DEV_IDS = new Set(
	(process.env.DEVIDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean),
);
const DEV_MODE = process.env.DEV === 'true';

export class devModePrecondition extends Precondition {
	public override chatInputRun(interaction: CommandInteraction) {
		return this.check(interaction.user.id);
	}

	public override messageRun(message: Message) {
		return this.check(message.author.id);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.check(interaction.user.id);
	}

	private check(userId: string) {
		if (!DEV_MODE) return this.ok();
		if (DEV_IDS.has(userId)) return this.ok();
		return this.error({
			message: 'Please use the Official Quest Bot.\n\nThis bot is currently undergoing testing by a developer.',
		});
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		devMode: never;
	}
}
