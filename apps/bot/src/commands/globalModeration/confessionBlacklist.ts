import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { addConfessionBlacklist, removeConfessionBlacklist, isConfessionBlacklisted } from '#lib/confessions.js';
import { emojis } from '#utils/emoji.js';

export class ConfessionBlacklistCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['globalModerator'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: any) =>
			builder
				.setName('confessionblacklist')
				.setDescription('Manage the confession blacklist')
				.setDefaultMemberPermissions(0)
				.setDMPermission(false)
				.addSubcommand((sub: any) =>
					sub
						.setName('add')
						.setDescription('Blacklist a user from making confessions')
						.addUserOption((opt: any) => opt.setName('user').setDescription('User to blacklist').setRequired(true))
						.addStringOption((opt: any) => opt.setName('reason').setDescription('Reason').setMaxLength(512).setRequired(false)),
				)
				.addSubcommand((sub: any) =>
					sub
						.setName('remove')
						.setDescription('Remove a user from the confession blacklist')
						.addUserOption((opt: any) => opt.setName('user').setDescription('User to unblacklist').setRequired(true)),
				)
				.addSubcommand((sub: any) =>
					sub
						.setName('check')
						.setDescription('Check if a user is blacklisted from confessions')
						.addUserOption((opt: any) => opt.setName('user').setDescription('User to check').setRequired(true)),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		const user = interaction.options.getUser('user', true);

		if (subcommand === 'add') {
			const reason = interaction.options.getString('reason') ?? undefined;
			try {
				await addConfessionBlacklist(user.id, interaction.user.id, reason);
				await interaction.reply({
					content: `${emojis.rightArrow2} Blacklisted ${user} from confessions${reason ? ` (reason: ${reason})` : ''}.`,
					flags: MessageFlags.Ephemeral,
				});
			} catch (err) {
				console.error(err);
				await interaction.reply({
					content: `${emojis.rightArrow2} Failed to blacklist that user.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		if (subcommand === 'remove') {
			await removeConfessionBlacklist(user.id);
			await interaction.reply({
				content: `${emojis.rightArrow2} Removed ${user} from the confession blacklist.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		if (subcommand === 'check') {
			const blacklisted = await isConfessionBlacklisted(user.id);
			await interaction.reply({
				content: blacklisted
					? `${emojis.rightArrow2} ${user} is blacklisted from confessions.`
					: `${emojis.rightArrow2} ${user} is not blacklisted.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
