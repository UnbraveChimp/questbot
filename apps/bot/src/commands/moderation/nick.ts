import { Command } from '@sapphire/framework';
import {
	type GuildMember,
	MessageFlags,
	PermissionFlagsBits,
	PermissionsBitField,
	type SlashCommandStringOption,
	type SlashCommandUserOption,
} from 'discord.js';
import { errorEmbed, successEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

export class NickCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('nick')
				.setDescription("Change a member's nickname.")
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
				.addUserOption((option: SlashCommandUserOption) =>
					option.setName('member').setDescription('Select a member to change their nickname').setRequired(true),
				)
				.addStringOption((option: SlashCommandStringOption) =>
					option.setName('nickname').setDescription('Nickname (leave empty to reset)').setMaxLength(32),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} This command can only be used in a server.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const member = interaction.member as GuildMember;

		if (!member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} You do not have permission to manage nicknames.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const targetMember = interaction.options.getMember('member');
		const nickname = interaction.options.getString('nickname') ?? null;

		if (!targetMember) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} That user is not in this server.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (targetMember.id === interaction.guild.ownerId) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} You cannot change the server owner's nickname.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (member.roles.highest.position <= targetMember.roles.highest.position) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} You cannot moderate someone with a higher or equal role.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!targetMember.manageable) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} I cannot manage this member's nickname.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			await targetMember.setNickname(nickname);
			await interaction.reply({
				embeds: [
					successEmbed(
						nickname
							? `${emojis.rightArrow2} Set <@${targetMember.user.id}>'s nickname to **${nickname}**.`
							: `${emojis.rightArrow2} Reseted <@${targetMember.user.id}>'s nickname.`,
					),
				],
				flags: MessageFlags.Ephemeral,
			});
		} catch {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} Failed to update <@${targetMember.user.id}>'s nickname.`)],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
