import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	type Guild,
	InteractionContextType,
	type MessageComponentInteraction,
	MessageFlags,
	PermissionFlagsBits,
	RoleSelectMenuBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getSettings, type ServerSettings, updateSettings } from '#lib/settings.js';
import { errorEmbed, infoEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

const STALE_INTERACTION_ERROR_CODES = new Set([10_015, 50_027, 10062]);

function isStaleInteractionError(error: unknown): error is { code: number } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		typeof error.code === 'number' &&
		STALE_INTERACTION_ERROR_CODES.has(error.code)
	);
}

function buildWelcomePanel(settings: ServerSettings, guild: Guild, status?: string) {
	const currentChannelName = settings.welcomeChannelId
		? guild.channels.cache.get(settings.welcomeChannelId)?.name
		: null;

	const toggleMenu = new StringSelectMenuBuilder()
		.setCustomId('welcomeToggle')
		.setPlaceholder(`${settings.welcomePeople ? 'Enabled' : 'Disabled'}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel('Enable')
				.setDescription('Send a message when a user joins the server.')
				.setValue('enable'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Disable')
				.setDescription("Don't send a message when a user joins the server.")
				.setValue('disable'),
		);

	const channelMenu = new ChannelSelectMenuBuilder()
		.setCustomId('welcomeChannel')
		.setPlaceholder(currentChannelName ? `#${currentChannelName}` : 'Select a channel for welcome messages')
		.setChannelTypes(ChannelType.GuildText);

	return {
		embeds: [
			infoEmbed(
				status
					? `${emojis.rightArrow1} **Welcome** module:\n${emojis.rightArrow2} ${status}`
					: `${emojis.rightArrow1} **Welcome** module:`,
			),
		],
		components: [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu),
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu),
		],
	};
}

function buildTicketPanel(settings: ServerSettings, guild: Guild, status?: string) {
	const currentCategoryName = settings.ticketCategoryId
		? guild.channels.cache.get(settings.ticketCategoryId)?.name
		: null;

	const categoryMenu = new ChannelSelectMenuBuilder()
		.setCustomId('ticketCategory')
		.setPlaceholder(currentCategoryName ?? 'Select a category for tickets')
		.setChannelTypes(ChannelType.GuildCategory);

	const removeButton = new ButtonBuilder()
		.setCustomId('ticketCategoryRemove')
		.setLabel('Remove Category')
		.setStyle(ButtonStyle.Danger)
		.setDisabled(!settings.ticketCategoryId);

	const currentStaffRole = settings.staffRole ? guild.roles.cache.get(settings.staffRole)?.name : null;

	const staffRole = new RoleSelectMenuBuilder()
		.setCustomId('staffRole')
		.setPlaceholder(currentStaffRole ?? 'Select a ticket staff role');

	const removeStaffRoleButton = new ButtonBuilder()
		.setCustomId('removeStaffRole')
		.setLabel('Remove Staff Role')
		.setStyle(ButtonStyle.Danger)
		.setDisabled(!settings.staffRole);

	const currentTranscriptChannelName = settings.ticketTranscriptChannelId
		? guild.channels.cache.get(settings.ticketTranscriptChannelId)?.name
		: null;

	const ticketTranscriptChannel = new ChannelSelectMenuBuilder()
		.setCustomId('ticketTranscriptChannel')
		.setPlaceholder(
			currentTranscriptChannelName ? `#${currentTranscriptChannelName}` : 'Select a channel for ticket transcripts',
		)
		.setChannelTypes(ChannelType.GuildText);

	const removeTranscriptChannelButton = new ButtonBuilder()
		.setCustomId('removeTranscriptChannel')
		.setLabel('Remove Transcript Channel')
		.setStyle(ButtonStyle.Danger)
		.setDisabled(!settings.ticketTranscriptChannelId);

	return {
		embeds: [
			infoEmbed(
				status
					? `${emojis.rightArrow1} **Tickets** module:\n${emojis.rightArrow2} ${status}`
					: `${emojis.rightArrow1} **Tickets** module:`,
			),
		],
		components: [
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(categoryMenu),
			new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(staffRole),
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(ticketTranscriptChannel),
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				removeButton,
				removeStaffRoleButton,
				removeTranscriptChannelButton,
			),
		],
	};
}

function buildLoggingPanel(settings: ServerSettings, guild: Guild, status?: string) {
	const currentChannelName = settings.loggingChannelId
		? guild.channels.cache.get(settings.loggingChannelId)?.name
		: null;

	const toggleMenu = new StringSelectMenuBuilder()
		.setCustomId('loggingToggle')
		.setPlaceholder(`${settings.loggingEnabled ? 'Enabled' : 'Disabled'}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel('Enable')
				.setDescription('Log all server events.')
				.setValue('enable'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Disable')
				.setDescription("Don't log any server events.")
				.setValue('disable'),
		);

	const channelMenu = new ChannelSelectMenuBuilder()
		.setCustomId('loggingChannel')
		.setPlaceholder(currentChannelName ? `#${currentChannelName}` : 'Select a channel for logging messages')
		.setChannelTypes(ChannelType.GuildText);

	return {
		embeds: [
			infoEmbed(
				status
					? `${emojis.rightArrow1} **Logging** module:\n${emojis.rightArrow2} ${status}`
					: `${emojis.rightArrow1} **Logging** module:`,
			),
		],
		components: [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu),
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu),
		],
	};
}

function buildConfessionPanel(settings: ServerSettings, guild: Guild, status?: string) {
	const currentChannelName = settings.confessionChannelId
		? guild.channels.cache.get(settings.confessionChannelId)?.name
		: null;

	const toggleMenu = new StringSelectMenuBuilder()
		.setCustomId('confessionToggle')
		.setPlaceholder(`${settings.confessionEnabled ? 'Enabled' : 'Disabled'}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel('Enable')
				.setDescription('Enable confessions for this server.')
				.setValue('enable'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Disable')
				.setDescription('Disable confessions for this server.')
				.setValue('disable'),
		);

	const channelMenu = new ChannelSelectMenuBuilder()
		.setCustomId('confessionChannel')
		.setPlaceholder(currentChannelName ? `#${currentChannelName}` : 'Select a channel for confessions')
		.setChannelTypes(ChannelType.GuildText);

	return {
		embeds: [
			infoEmbed(
				status
					? `${emojis.rightArrow1} **Confessions** module:\n${emojis.rightArrow2} ${status}`
					: `${emojis.rightArrow1} **Confessions** module:`,
			),
		],
		components: [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu),
			new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu),
		],
	};
}

function buildHaikuPanel(settings: ServerSettings, status?: string) {
	const toggleMenu = new StringSelectMenuBuilder()
		.setCustomId('haikuToggle')
		.setPlaceholder(`${settings.haikuEnabled ? 'Enabled' : 'Disabled'}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel('Enable')
				.setDescription('Reply when a message forms a haiku.')
				.setValue('enable'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Disable')
				.setDescription("Don't detect haikus.")
				.setValue('disable'),
		);

	return {
		embeds: [
			infoEmbed(
				status
					? `${emojis.rightArrow1} **Haiku** module:\n${emojis.rightArrow2} ${status}`
					: `${emojis.rightArrow1} **Haiku** module:`,
			),
		],
		components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu)],
	};
}

function buildAutoPublisherPanel(settings: ServerSettings, status?: string) {
	const toggleMenu = new StringSelectMenuBuilder()
		.setCustomId('autoPublisherToggle')
		.setPlaceholder(`${settings.autoPublisher ? 'Enabled' : 'Disabled'}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel('Enable')
				.setDescription('Automatically publish messages posted in announcement channels.')
				.setValue('enable'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Disable')
				.setDescription("Don't publish announcements automatically.")
				.setValue('disable'),
		);

	return {
		embeds: [
			infoEmbed(
				status
					? `${emojis.rightArrow1} **Auto Publisher** module:\n${emojis.rightArrow2} ${status}`
					: `${emojis.rightArrow1} **Auto Publisher** module:\n${emojis.rightArrow2} I need **Manage Messages** (in your announcement channels) to publish other people's messages.`,
			),
		],
		components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu)],
	};
}

async function normalizeTicketSettings(guildId: string, guild: Guild, settings: ServerSettings) {
	if (!settings.ticketCategoryId) return settings;

	const ticketCategory =
		guild.channels.cache.get(settings.ticketCategoryId) ??
		(await guild.channels.fetch(settings.ticketCategoryId).catch(() => null));

	if (ticketCategory?.type === ChannelType.GuildCategory) return settings;

	return updateSettings(guildId, guild.name, { ticketCategoryId: null });
}

export class SettingsCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('settings')
				.setDescription("Configure the bot's settings for this server.")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setContexts(InteractionContextType.Guild),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const safeEditReply = async (options: Parameters<Command.ChatInputCommandInteraction['editReply']>[0]) => {
			try {
				await interaction.editReply(options);
			} catch (error) {
				if (isStaleInteractionError(error)) return;
				throw error;
			}
		};

		const settingMenu = new StringSelectMenuBuilder()
			.setCustomId('settingOption')
			.setPlaceholder('Select a setting to modify')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Welcome Message')
					.setDescription('Send a message when a user joins the server.')
					.setValue('welcome'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Tickets')
					.setDescription('Configure where tickets are created.')
					.setValue('tickets'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Logging')
					.setDescription('Configure server channel logging.')
					.setValue('logging'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Confessions')
					.setDescription('Configure where confessions are posted and whether they are enabled.')
					.setValue('confessions'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Haiku')
					.setDescription('Reply when a message forms a haiku.')
					.setValue('haiku'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Auto Publisher')
					.setDescription('Automatically publish messages posted in announcement channels.')
					.setValue('autoPublisher'),
			);

		const response = await interaction.reply({
			components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(settingMenu)],
			flags: MessageFlags.Ephemeral,
			withResponse: true,
		});

		const collectorFilter = (i: MessageComponentInteraction) =>
			i.user.id === interaction.user.id && (i.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false);

		try {
			const settingChoice = await import('#utils/collectors.js').then((m) =>
				m.awaitMessageComponentSafe(response.resource!.message!, { filter: collectorFilter, time: 60_000 }),
			);

			if (!settingChoice) {
				await safeEditReply({
					embeds: [errorEmbed(`${emojis.rightArrow2} No response within a minute or errored.`)],
					components: [],
				});
				return;
			}

			if (!settingChoice.isStringSelectMenu()) return;

			const guildId = interaction.guildId;
			const guild = interaction.guild;

			if (!guildId || !guild) {
				await settingChoice.update({
					embeds: [errorEmbed(`${emojis.rightArrow2} This command can only be used in a server.`)],
					components: [],
				});
				return;
			}

			const settings = await normalizeTicketSettings(guildId, guild, await getSettings(guildId, guild.name));

			if (settingChoice.values[0] === 'welcome') {
				await settingChoice.update(buildWelcomePanel(settings, guild));
			} else if (settingChoice.values[0] === 'tickets') {
				await settingChoice.update(buildTicketPanel(settings, guild));
			} else if (settingChoice.values[0] === 'logging') {
				await settingChoice.update(buildLoggingPanel(settings, guild));
			} else if (settingChoice.values[0] === 'confessions') {
				await settingChoice.update(buildConfessionPanel(settings, guild));
			} else if (settingChoice.values[0] === 'haiku') {
				await settingChoice.update(buildHaikuPanel(settings));
			} else if (settingChoice.values[0] === 'autoPublisher') {
				await settingChoice.update(buildAutoPublisherPanel(settings));
			} else {
				return;
			}

			const collector = settingChoice.message.createMessageComponentCollector({
				filter: collectorFilter,
				time: 60_000,
			});

			collector.on('collect', async (i) => {
				if (i.customId === 'welcomeToggle' && i.isStringSelectMenu()) {
					const enable = i.values[0] === 'enable';
					const next = await updateSettings(guildId, guild.name, { welcomePeople: enable });

					await i.update(buildWelcomePanel(next, guild, `Welcome module **${enable ? 'enabled' : 'disabled'}**.`));
				} else if (i.customId === 'welcomeChannel' && i.isChannelSelectMenu()) {
					const channelId = i.values[0];
					const next = await updateSettings(guildId, guild.name, { welcomeChannelId: channelId });

					await i.update(buildWelcomePanel(next, guild, `Welcome channel set to <#${channelId}>.`));
				} else if (i.customId === 'ticketCategory' && i.isChannelSelectMenu()) {
					const categoryId = i.values[0];
					const next = await updateSettings(guildId, guild.name, { ticketCategoryId: categoryId });

					await i.update(buildTicketPanel(next, guild, `Ticket category set to <#${categoryId}>.`));
				} else if (i.customId === 'ticketCategoryRemove' && i.isButton()) {
					const next = await updateSettings(guildId, guild.name, { ticketCategoryId: null });

					await i.update(buildTicketPanel(next, guild, 'Ticket category removed.'));
				} else if (i.customId === 'staffRole' && i.isRoleSelectMenu()) {
					const roleId = i.values[0];
					const next = await updateSettings(guildId, guild.name, { staffRole: roleId });

					await i.update(buildTicketPanel(next, guild, `Ticket staff role set to <@&${roleId}>.`));
				} else if (i.customId === 'removeStaffRole' && i.isButton()) {
					const next = await updateSettings(guildId, guild.name, { staffRole: null });

					await i.update(buildTicketPanel(next, guild, 'Ticket staff role removed.'));
				} else if (i.customId === 'ticketTranscriptChannel' && i.isChannelSelectMenu()) {
					const channelId = i.values[0];
					const next = await updateSettings(guildId, guild.name, { ticketTranscriptChannelId: channelId });

					await i.update(buildTicketPanel(next, guild, `Ticket transcript channel set to <#${channelId}>.`));
				} else if (i.customId === 'removeTranscriptChannel' && i.isButton()) {
					const next = await updateSettings(guildId, guild.name, { ticketTranscriptChannelId: null });

					await i.update(buildTicketPanel(next, guild, 'Ticket transcript channel removed.'));
				} else if (i.customId === 'loggingToggle' && i.isStringSelectMenu()) {
					const enable = i.values[0] === 'enable';
					const next = await updateSettings(guildId, guild.name, { loggingEnabled: enable });

					await i.update(buildLoggingPanel(next, guild, `Logging module **${enable ? 'enabled' : 'disabled'}**.`));
				} else if (i.customId === 'loggingChannel' && i.isChannelSelectMenu()) {
					const channelId = i.values[0];
					const next = await updateSettings(guildId, guild.name, { loggingChannelId: channelId });

					await i.update(buildLoggingPanel(next, guild, `Logging channel set to <#${channelId}>.`));
				} else if (i.customId === 'confessionToggle' && i.isStringSelectMenu()) {
					const enable = i.values[0] === 'enable';
					const next = await updateSettings(guildId, guild.name, { confessionEnabled: enable });

					await i.update(buildConfessionPanel(next, guild, `Confessions **${enable ? 'enabled' : 'disabled'}**.`));
				} else if (i.customId === 'confessionChannel' && i.isChannelSelectMenu()) {
					const channelId = i.values[0];
					const next = await updateSettings(guildId, guild.name, { confessionChannelId: channelId });

					await i.update(buildConfessionPanel(next, guild, `Confession channel set to <#${channelId}>.`));
				} else if (i.customId === 'haikuToggle' && i.isStringSelectMenu()) {
					const enable = i.values[0] === 'enable';
					const next = await updateSettings(guildId, guild.name, { haikuEnabled: enable });

					await i.update(buildHaikuPanel(next, `Haiku **${enable ? 'enabled' : 'disabled'}**.`));
				} else if (i.customId === 'autoPublisherToggle' && i.isStringSelectMenu()) {
					const enable = i.values[0] === 'enable';
					const next = await updateSettings(guildId, guild.name, { autoPublisher: enable });

					await i.update(buildAutoPublisherPanel(next, `Auto Publisher **${enable ? 'enabled' : 'disabled'}**.`));
				}
			});

			collector.on('end', async () => {
				await safeEditReply({
					embeds: [infoEmbed(`${emojis.rightArrow2} Closed.`)],
					components: [],
				});
			});
		} catch (err) {
			console.error(err);
			await safeEditReply({
				embeds: [errorEmbed(`${emojis.rightArrow2} No response within a minute or errored.`)],
				components: [],
			});
		}
	}
}
