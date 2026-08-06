// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { HONEYPOT_LEARN_ID } from '#lib/honeypot.js';

export class HoneypotLearnMoreHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button,
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== HONEYPOT_LEARN_ID) return this.none();

		return this.some();
	}

	public async run(interaction: ButtonInteraction) {
		await interaction.reply({
			content:
				'This is to catch spammers and has been enabled by the server staff.\nAdmins are excluded from the honey pot.\n\n-# Powered by Quest.',
			flags: MessageFlags.Ephemeral,
		});
	}
}
