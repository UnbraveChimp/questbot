// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, type ButtonInteraction, ButtonStyle, MessageFlags } from 'discord.js';
import {
	AlreadyEnteredError,
	buildGiveawayComponents,
	buildGiveawayEmbed,
	enterGiveaway,
	GiveawayFullError,
	leaveGiveaway,
	NotEnteredError,
	refreshGiveawayMessage,
} from '#lib/giveaways.js';
import { emojis } from '#utils/emoji.js';

const ENTER_PREFIX = 'giveaway-enter-';
const LEAVE_PREFIX = 'giveaway-leave-';

interface GiveawayAction {
	action: 'enter' | 'leave';
	giveawayId: string;
}

export class GiveawayEnterHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button,
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith(ENTER_PREFIX)) {
			return this.some({ action: 'enter', giveawayId: interaction.customId.slice(ENTER_PREFIX.length) });
		}

		if (interaction.customId.startsWith(LEAVE_PREFIX)) {
			return this.some({ action: 'leave', giveawayId: interaction.customId.slice(LEAVE_PREFIX.length) });
		}

		return this.none();
	}

	public async run(interaction: ButtonInteraction, payload: GiveawayAction) {
		if (payload.action === 'enter') {
			await this.handleEnter(interaction, payload.giveawayId);
			return;
		}

		await this.handleLeave(interaction, payload.giveawayId);
	}

	private async handleEnter(interaction: ButtonInteraction, giveawayId: string) {
		try {
			const giveaway = await enterGiveaway(giveawayId, interaction.user.id);

			if (!giveaway) {
				await interaction.reply({
					content: `${emojis.rightArrow2} This giveaway has ended.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			await interaction.update({
				embeds: [buildGiveawayEmbed(giveaway)],
				components: buildGiveawayComponents(giveaway),
			});

			await interaction.followUp({
				content: `${emojis.rightArrow2} You've entered the giveaway for **${giveaway.prize}**!`,
				flags: MessageFlags.Ephemeral,
			});
		} catch (err) {
			if (err instanceof AlreadyEnteredError) {
				const leaveButton = new ButtonBuilder()
					.setCustomId(`${LEAVE_PREFIX}${giveawayId}`)
					.setLabel('Leave')
					.setStyle(ButtonStyle.Danger);

				await interaction.reply({
					content: `${emojis.rightArrow2} ${err.message}`,
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents(leaveButton)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (err instanceof GiveawayFullError) {
				await interaction.reply({
					content: `${emojis.rightArrow2} ${err.message}`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			throw err;
		}
	}

	private async handleLeave(interaction: ButtonInteraction, giveawayId: string) {
		try {
			const giveaway = await leaveGiveaway(giveawayId, interaction.user.id);

			if (!giveaway) {
				await interaction.update({
					content: `${emojis.rightArrow2} This giveaway has ended.`,
					components: [],
				});
				return;
			}

			await interaction.update({
				content: `${emojis.rightArrow2} You have left the giveaway for **${giveaway.prize}**.`,
				components: [],
			});

			await refreshGiveawayMessage(interaction.client, giveaway);
		} catch (err) {
			if (err instanceof NotEnteredError) {
				await interaction.update({
					content: `${emojis.rightArrow2} ${err.message}`,
					components: [],
				});
				return;
			}

			throw err;
		}
	}
}
