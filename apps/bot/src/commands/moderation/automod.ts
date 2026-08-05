// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	PermissionsBitField,
	type SlashCommandStringOption,
	type SlashCommandSubcommandBuilder,
} from 'discord.js';
import { createAutoMod, DuplicateAutoModError, getAutoMod, getAutoMods, removeAutoMod } from '#lib/automod.js';
import { LimitError } from '#lib/limits.js';
import { awaitMessageComponentSafe } from '#utils/collectors.js';
import { errorEmbed, infoEmbed, successEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

export class AutoModCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('automod')
				.setDescription('Keep your server clean!')
				.setDefaultMemberPermissions(0)
				.addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
					subcommand
						.setName('add')
						.setDescription('Create a new automod rule.')
						.addStringOption((option: SlashCommandStringOption) =>
							option.setName('word').setDescription('The word to block').setRequired(true).setMaxLength(100),
						),
				)
				.addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
					subcommand
						.setName('remove')
						.setDescription('Remove words from the automod list.')
						.addStringOption((option: SlashCommandStringOption) =>
							option
								.setName('word')
								.setDescription('The word to remove')
								.setAutocomplete(true)
								.setRequired(true)
								.setMaxLength(36),
						),
				)
				.addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
					subcommand.setName('list').setDescription('List all blocked words.'),
				),
		);
	}

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		if (!interaction.guildId) {
			await interaction.respond([]);
			return;
		}

		const focusedOption = interaction.options.getFocused(true);

		if (interaction.options.getSubcommand() !== 'remove' || focusedOption.name !== 'word') {
			await interaction.respond([]);
			return;
		}

		const autoMods = await getAutoMods(interaction.guildId);
		const choices = autoMods.slice(0, 25).map((autoMod) => ({
			name: autoMod.word,
			value: autoMod.id,
		}));

		await interaction.respond(choices);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} This command can only be used in a server.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} You do not have permission to manage automod.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'add') {
			const word = interaction.options.getString('word', true).trim().toLowerCase();

			if (!word) {
				await interaction.reply({
					embeds: [errorEmbed(`${emojis.rightArrow2} The word cannot be empty or contain only whitespace.`)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			try {
				await createAutoMod(interaction.guildId, interaction.guild.name, word);
				await interaction.reply({
					embeds: [successEmbed(`${emojis.rightArrow2} The word '${word}' has been added to the automod list.`)],
					flags: MessageFlags.Ephemeral,
				});
			} catch (err) {
				if (err instanceof LimitError) {
					await interaction.reply({
						embeds: [errorEmbed(`${emojis.rightArrow2} ${err.message}`)],
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				if (err instanceof DuplicateAutoModError) {
					await interaction.reply({
						embeds: [errorEmbed(`${emojis.rightArrow2} ${err.message}`)],
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				console.error(err);

				await interaction.reply({
					embeds: [errorEmbed(`${emojis.rightArrow2} That word is already blocked in this server.`)],
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		if (subcommand === 'list') {
			const autoMods = await getAutoMods(interaction.guildId);
			if (autoMods.length === 0) {
				await interaction.reply({
					embeds: [infoEmbed(`${emojis.rightArrow2} There are no words in the automod list.`)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const totalPages = Math.ceil(autoMods.length / 10);
			let page = 0;

			const buildEmbed = (page: number) => {
				const slice = autoMods.slice(page * 10, (page + 1) * 10);
				const wordList = slice.map((autoMod) => `${emojis.rightArrow1} ${autoMod.word}`).join('\n');
				return infoEmbed(`**Blocked Words** (Page ${page + 1}/${totalPages}):\n${wordList}`);
			};

			const buildRow = (page: number) =>
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId('prev')
						.setLabel('<')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(page === 0),
					new ButtonBuilder()
						.setCustomId('next')
						.setLabel('>')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(page >= totalPages - 1),
				);

			if (totalPages === 1) {
				await interaction.reply({
					embeds: [buildEmbed(0)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const response = await interaction.reply({
				embeds: [buildEmbed(page)],
				components: [buildRow(page)],
				flags: MessageFlags.Ephemeral,
				withResponse: true,
			});

			const collectorFilter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;

			while (true) {
				const btn = await awaitMessageComponentSafe(response.resource!.message!, {
					filter: collectorFilter,
					time: 60_000,
				});

				if (!btn) {
					await interaction.editReply({ components: [] });
					break;
				}

				if (btn.customId === 'prev') page = Math.max(0, page - 1);
				if (btn.customId === 'next') page = Math.min(totalPages - 1, page + 1);

				await btn.update({
					embeds: [buildEmbed(page)],
					components: [buildRow(page)],
				});
			}
		}

		if (subcommand === 'remove') {
			const autoModId = interaction.options.getString('word', true);
			const autoMod = await getAutoMod(autoModId);

			if (!autoMod || autoMod.guildId !== interaction.guildId) {
				await interaction.reply({
					embeds: [errorEmbed(`${emojis.rightArrow2} That blocked word doesn't exist.`)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			await removeAutoMod(autoMod.id);
			await interaction.reply({
				embeds: [
					successEmbed(`${emojis.rightArrow2} The word '${autoMod.word}' has been removed from the automod list.`),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
