import { Command } from '@sapphire/framework';
import type { SlashCommandUserOption } from 'discord.js';
import { ASSET_SIZE, assetMessage } from '#utils/profile.js';

export class PfpCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('pfp')
				.setDescription("Easily download or view your own or someone else's pfp.")
				.addUserOption((option: SlashCommandUserOption) =>
					option.setName('user').setDescription('The user whose profile picture you want to view').setRequired(false),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const user = interaction.options.getUser('user') ?? interaction.user;
		// todo: in the future size could become an option rather than 4096 hard coded
		const avatarUrl = user.displayAvatarURL({ size: ASSET_SIZE });

		await interaction.editReply(assetMessage(user, avatarUrl));
	}
}
