// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import { infoEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

export class DiscordCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('discord').setDescription('Get a link to the official Discord server!'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({ embeds: [infoEmbed(`${emojis.rightArrow1} https://vantern.org/discord`)] });
	}
}
