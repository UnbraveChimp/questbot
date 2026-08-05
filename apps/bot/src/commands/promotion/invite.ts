// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import { infoEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

export class InviteCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('invite').setDescription('Get a link to add the bot to your server!'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({ embeds: [infoEmbed(`${emojis.rightArrow1} https://vantern.org/bot/invite`)] });
	}
}
