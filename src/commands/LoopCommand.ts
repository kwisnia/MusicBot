import {
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  Message,
  MessageComponentInteraction,
  SlashCommandBuilder,
  VoiceChannel,
} from 'discord.js';
import { Logger } from 'winston';
import NoGuildError from '../errors/NoGuildError';
import UserNotInVoiceChannelError from '../errors/UserNotInVoiceChannelError';
import { ISubscriptionService } from '../services/music/ISubscriptionService';
import BaseCommand from '../services/interaction/BaseCommand';
import { LoopMode } from '../typings/AudioPlayerStatus';

export default class LoopCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('loop')
      .setDescription('Enables looping of a currently playing track')
      .addStringOption((option) =>
        option
          .setName('mode')
          .setDescription('Loop mode')
          .setRequired(true)
          .addChoices(
            {
              name: 'Track',
              value: LoopMode.Track,
            },
            {
              name: 'Queue',
              value: LoopMode.Queue,
            },
          ),
      ) as SlashCommandBuilder;
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Loop command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command loop was not called in a voice channel',
      );
    }
    const mode = interaction.options.getString('mode');
    const newValue = this.subscriptionService.changeLoop(
      interaction.guildId!,
      mode as LoopMode,
    );
    await interaction.reply(
      `🔂 **Loop for ${mode} ${newValue ? 'enabled' : 'disabled'}!**`,
    );
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
