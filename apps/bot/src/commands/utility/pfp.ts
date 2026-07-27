import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type SlashCommandUserOption } from 'discord.js';
import { Colors } from '#utils/embeds.js';

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
		const avatarUrl = user.displayAvatarURL({ size: 4096 });

		const embed = new EmbedBuilder()
			.setColor(Colors.info)
			.setTitle(`${user.displayName}`)
			.setImage(avatarUrl)
			.setFooter({ text: `ID: ${user.id}` });

		const downloadRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(avatarUrl),
		);

		await interaction.editReply({ embeds: [embed], components: [downloadRow] });
	}
}
