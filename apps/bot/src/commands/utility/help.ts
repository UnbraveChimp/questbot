import { Command } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';

export class HelpCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('help').setDescription('Show what the bot is capable of.'),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const commands = this.container.stores.get('commands');

		const commandList = Array.from(commands.values())
			.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
			.map((cmd) => {
				// biome-ignore lint/complexity/useLiteralKeys: x
				const description = cmd.applicationCommandRegistry['apiCalls'][0]?.builtData.description ?? cmd.description;
				// biome-ignore lint/complexity/useLiteralKeys: x
				const commandName = cmd.applicationCommandRegistry['apiCalls'][0]?.builtData.name ?? cmd.name;

				return `${emojis.rightArrow1} \`${commandName}\` - ${description}`;
			})
			.join('\n');

		const embed = new EmbedBuilder().setTitle('Commands').setDescription(commandList).addFields({
			name: 'Links',
			value:
				'Status: https://status.vantern.org/\nOfficial Discord Server: https://discord.gg/F4HYE8frK2\nDocumentation: https://docs.vantern.org/',
		});

		await interaction.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	}
}
