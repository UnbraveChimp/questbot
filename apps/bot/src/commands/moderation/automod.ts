import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionsBitField } from 'discord.js';
import { createAutoMod, DuplicateAutoModError, getAutoMod, getAutoMods, removeAutoMod } from '#lib/automod.js';
import { getQuestUnlimitedPurchaseComponents, LimitError } from '#lib/limits.js';
import { emojis } from '#utils/emoji.js';
import { awaitMessageComponentSafe } from '#utils/collectors.js';

export class AutoModCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: any) =>
			builder
				.setName('automod')
				.setDescription('Block words from being said!')
				.addSubcommand((sub: any) =>
					sub
						.setName('add')
						.setDescription('Create a new automod rule.')
						.addStringOption((option: any) =>
							option.setName('word').setDescription('The word to block').setRequired(true).setMaxLength(100),
						),
				)
				.addSubcommand((sub: any) =>
					sub
						.setName('remove')
						.setDescription('Remove words from the automod list.')
						.addStringOption((option: any) =>
							option.setName('word').setDescription('The word to remove').setAutocomplete(true).setRequired(true).setMaxLength(36),
						),
				)
				.addSubcommand((sub: any) => sub.setName('list').setDescription('List all blocked words.')),
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
				content: `${emojis.rightArrow2} This command can only be used in a server.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
			await interaction.reply({
				content: `${emojis.rightArrow2} You do not have permission to manage automod.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'add') {
			const word = interaction.options.getString('word', true).trim().toLowerCase();

			if (!word) {
				await interaction.reply({
					content: `${emojis.rightArrow2} The word cannot be empty or contain only whitespace.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			try {
				await createAutoMod(
					interaction.guildId,
					interaction.guild.name,
					word,
					interaction.client.application.entitlements,
				);
				await interaction.reply({
					content: `${emojis.rightArrow2} The word '${word}' has been added to the automod list.`,
					flags: MessageFlags.Ephemeral,
				});
			} catch (err) {
				if (err instanceof LimitError) {
					if (err.showQuestUnlimitedPrompt) {
						await interaction.reply({
							content: `${emojis.questUnlimited2} ${err.message} Unlock unlimited automod rules with QuestUnlimited.`,
							components: getQuestUnlimitedPurchaseComponents(interaction.client.application.id),
							flags: MessageFlags.Ephemeral,
						});
						return;
					}

					await interaction.reply({
						content: `${emojis.rightArrow2} ${err.message}`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				if (err instanceof DuplicateAutoModError) {
					await interaction.reply({
						content: `${emojis.rightArrow2} ${err.message}`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				console.error(err);

				await interaction.reply({
					content: `${emojis.rightArrow2} That word is already blocked in this server.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		if (subcommand === 'list') {
			const autoMods = await getAutoMods(interaction.guildId);
			if (autoMods.length === 0) {
				await interaction.reply({
					content: `${emojis.rightArrow2} There are no words in the automod list.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const totalPages = Math.ceil(autoMods.length / 10);
			let page = 0;

			const buildContent = (page: number) => {
				const slice = autoMods.slice(page * 10, (page + 1) * 10);
				const wordList = slice.map((autoMod) => `${emojis.rightArrow1} ${autoMod.word}`).join('\n');
				return `**Blocked Words** (Page ${page + 1}/${totalPages}):\n${wordList}`;
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
					content: buildContent(0),
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const response = await interaction.reply({
				content: buildContent(page),
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
					content: buildContent(page),
					components: [buildRow(page)],
				});
			}
		}

		if (subcommand === 'remove') {
			const autoModId = interaction.options.getString('word', true);
			const autoMod = await getAutoMod(autoModId);

			if (!autoMod || autoMod.guildId !== interaction.guildId) {
				await interaction.reply({
					content: `${emojis.rightArrow2} That blocked word doesn't exist.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			await removeAutoMod(autoMod.id);
			await interaction.reply({
				content: `${emojis.rightArrow2} The word '${autoMod.word}' has been removed from the automod list.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
