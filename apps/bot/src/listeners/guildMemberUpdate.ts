import { Listener } from '@sapphire/framework';
import { AuditLogEvent, Colors, EmbedBuilder, Events, type GuildMember } from 'discord.js';
import { getRecentAuditLogEntry, logEmbed } from '#lib/logging.js';

export class GuildMemberUpdateListener extends Listener<typeof Events.GuildMemberUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberUpdate,
		});
	}

	public async run(oldMember: GuildMember, newMember: GuildMember) {
		const beforeTimeout = oldMember.communicationDisabledUntilTimestamp ?? null;
		const afterTimeout = newMember.communicationDisabledUntilTimestamp ?? null;

		if (Boolean(beforeTimeout) === Boolean(afterTimeout)) return;

		const auditEntry = await getRecentAuditLogEntry(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id);

		const timeoutAdded = !beforeTimeout && afterTimeout;
		const embed = new EmbedBuilder()
			.setTitle(timeoutAdded ? 'Member Timed Out' : 'Timeout Removed')
			.setColor(timeoutAdded ? Colors.Orange : 0xfac898)    
			.addFields(
				{ name: 'Member', value: `${newMember.user.tag} (${newMember.id})`, inline: false },
				{ name: 'Username', value: newMember.user.toString(), inline: true },
			)
			.setTimestamp();

		if (auditEntry?.executor) {
			embed.addFields({ name: 'Moderator', value: `${auditEntry.executor.tag}`, inline: true });
		}

		if (auditEntry?.reason) {
			embed.addFields({ name: 'Reason', value: auditEntry.reason, inline: false });
		}

		if (afterTimeout) {
			embed.addFields({
				name: 'Expires',
				value: `<t:${Math.floor(afterTimeout / 1000)}:R>`,
				inline: true,
			});
		}

		await logEmbed(newMember.guild, embed);
	}
}
