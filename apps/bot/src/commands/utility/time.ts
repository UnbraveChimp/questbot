// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import { getCountryForTimezone, type TimezoneName } from 'countries-and-timezones';
import { MessageFlags, type SlashCommandStringOption } from 'discord.js';
import { errorEmbed, infoEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

const CHOICES = Intl.supportedValuesOf('timeZone').map((zone) => {
	const country = getCountryForTimezone(zone as TimezoneName);

	return {
		name: country ? `${zone} - ${country.name}` : zone, // shown as "Europe/Amsterdam - Netherlands"
		value: zone,
		search: `${zone} ${country?.name ?? ''} ${country?.id ?? ''}`.toLowerCase().replaceAll('_', ' '),
	};
});

const VALID_ZONES = new Set(CHOICES.map((choice) => choice.value));

export class TimeCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('time')
				.setDescription('Show the current time, anywhere around the globe.')
				.addStringOption((option: SlashCommandStringOption) =>
					option
						.setName('location')
						.setDescription('Search for a city or country')
						.setAutocomplete(true)
						.setRequired(true)
						.setMaxLength(64),
				),
		);
	}

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		const query = interaction.options.getFocused().toLowerCase().replaceAll('_', ' ');
		const matches = query ? CHOICES.filter((choice) => choice.search.includes(query)) : CHOICES;

		await interaction.respond(matches.slice(0, 25).map(({ name, value }) => ({ name, value })));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const location = interaction.options.getString('location', true);

		// autocomplete suggests... but does not restrict.
		if (!VALID_ZONES.has(location)) {
			await interaction.reply({
				embeds: [
					errorEmbed(
						`${emojis.rightArrow2} \`${location}\` is not a timezone... or I don't know about it; Try something else.`,
					),
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const now = new Date();
		const country = getCountryForTimezone(location as TimezoneName);

		//* formatted here rather than with <t:unix:t>, which would render in the user's timezone
		const formatted = new Intl.DateTimeFormat('en-GB', {
			timeZone: location,
			dateStyle: 'full',
			timeStyle: 'short',
		}).format(now);

		const offset = new Intl.DateTimeFormat('en-GB', { timeZone: location, timeZoneName: 'longOffset' })
			.formatToParts(now)
			.find((part) => part.type === 'timeZoneName')?.value;

		await interaction.reply({
			embeds: [
				infoEmbed(
					`${emojis.rightArrow1} ${location}${country ? ` - ${country.name}` : ''}\n${emojis.rightArrow1} \`${formatted}\`\n${emojis.rightArrow2} \`${offset ?? 'Unknown offset'}\``,
				),
			],
		});
	}
}
