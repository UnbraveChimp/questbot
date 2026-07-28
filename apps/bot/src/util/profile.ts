import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type User } from 'discord.js';
import { Colors } from '#utils/embeds.js';

export const ASSET_SIZE = 4096; //* global size for fetching an asset from a user

export interface AssetMessage {
	embeds: EmbedBuilder[];
	components: ActionRowBuilder<ButtonBuilder>[];
}

export function assetMessage(user: User, url: string): AssetMessage {
	const embed = new EmbedBuilder()
		.setColor(Colors.info)
		.setTitle(`${user.displayName}`)
		.setImage(url)
		.setFooter({ text: `ID: ${user.id}` });

	const downloadRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(url),
	);

	return { embeds: [embed], components: [downloadRow] };
}
