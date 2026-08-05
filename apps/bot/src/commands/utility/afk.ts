// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import { MessageFlags, type SlashCommandBuilder, type SlashCommandStringOption } from 'discord.js';
import { setAfk } from '#lib/afk.js';
import { containsBlockedWord } from '#lib/automod.js';
import { errorEmbed, successEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

export class AfkCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: SlashCommandBuilder) =>
			builder
				.setName('afk')
				.setDescription('Go AFK.')
				.addStringOption((option: SlashCommandStringOption) =>
					option
						.setName('message')
						.setDescription('Set a message to let people know why you went AFK.')
						.setMaxLength(200),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		const message = interaction.options.getString('message') ?? undefined;

		if (message && (await containsBlockedWord(interaction.guild.id, message))) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} Your message contains a word that isn't allowed here.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await setAfk(interaction.guild.id, interaction.guild.name, interaction.user.id, message);

		await interaction.reply({
			embeds: [successEmbed(`${emojis.rightArrow2} You are now AFK${message ? `: ${message}` : '.'}`)],
		});
	}
}
