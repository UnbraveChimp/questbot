import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';

export class VoteCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ['devMode'] });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName('vote').setDescription('Support QuestBot by voting for it!'),
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.reply(`${emojis.rightArrow1} https://top.gg/bot/1494686224508522579`);
        await interaction.followUp(`Voting is much appreciated! ❤️`);
    }
}
