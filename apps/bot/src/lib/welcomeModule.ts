import { DiscordAPIError, type GuildMember, RESTJSONErrorCodes } from 'discord.js';
import { getSettings } from '#lib/settings.js';
import { emojis } from '#utils/emoji.js';

const ownerDmCooldown = new Map<string, number>();
const DM_COOLDOWN = 24 * 60 * 60 * 1000; // 24h

export async function sendWelcome(member: GuildMember): Promise<void> {
	const settings = await getSettings(member.guild.id, member.guild.name);
	if (!settings.welcomePeople || !settings.welcomeChannelId) return;

	const channel = await member.guild.channels.fetch(settings.welcomeChannelId).catch(() => null);
	if (!channel?.isTextBased() || !channel.isSendable()) return;

	try {
		await channel.send(`${emojis.rightArrow1} Welcome to **${member.guild.name}**, <@${member.user.id}>!`);
	} catch (err) {
		if (err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.MissingPermissions) {
			await notifyOwner(member, channel.id);
			return;
		}
		console.error(`[welcomeModule] Failed to send in ${member.guild.id}#${channel.id}:`, err);
	}
}

async function notifyOwner(member: GuildMember, channelId: string): Promise<void> {
	const guild = member.guild;
	const last = ownerDmCooldown.get(guild.id) ?? 0;
	if (Date.now() - last < DM_COOLDOWN) return;
	ownerDmCooldown.set(guild.id, Date.now());

	try {
		const owner = await guild.fetchOwner();
		await owner.send(
			`${emojis.rightArrow2} I couldn't send a welcome message in **${guild.name}** because I'm missing permissions in <#${channelId}>. Make sure I have permission to send messages there!`,
		);
	} catch (err) {
		console.warn(`[welcomeModule] Couldn't DM owner of ${guild.id}:`, err);
	}
}
