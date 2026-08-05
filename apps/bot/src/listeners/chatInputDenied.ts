// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ChatInputCommandDeniedPayload, Listener, type UserError } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';

export class ChatInputCommandDeniedListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, { ...options, event: 'chatInputCommandDenied' });
	}

	public override async run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
		if (interaction.deferred || interaction.replied) {
			await interaction.editReply({ content: error.message });
			return;
		}

		await interaction.reply({
			content: error.message,
			flags: MessageFlags.Ephemeral,
		});
	}
}
