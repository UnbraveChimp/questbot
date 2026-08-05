// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import { infoEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

export class VoteCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('vote').setDescription('Support Quest by voting for it!'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({
			embeds: [
				infoEmbed(`${emojis.rightArrow1} https://top.gg/bot/1494686224508522579\n\nVoting is much appreciated! ❤️`),
			],
		});
	}
}
