// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EmbedBuilder } from 'discord.js';

export const Colors = {
	error: 0xe74c3c,
	success: 0x2ecc71,
	info: 0xffffff,
} as const;

export function errorEmbed(description: string): EmbedBuilder {
	return new EmbedBuilder().setColor(Colors.error).setDescription(description);
}

export function successEmbed(description: string): EmbedBuilder {
	return new EmbedBuilder().setColor(Colors.success).setDescription(description);
}

export function infoEmbed(description: string): EmbedBuilder {
	return new EmbedBuilder().setColor(Colors.info).setDescription(description);
}
