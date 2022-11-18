import {
  Client,
  ChatInputCommandInteraction,
  EmbedBuilder,
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

export default class SkipCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skips a track in queue')
      .addIntegerOption((option) =>
        option.setName('index').setDescription('Position of track to skip'),
      ) as SlashCommandBuilder;
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Skip command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command skip was not called in a voice channel',
      );
    }
    const index = interaction.options.getInteger('index');
    let skippedSong;
    if (index) {
      skippedSong = await this.subscriptionService.skipSongInQueue(
        interaction.guildId!,
        index,
      );
    } else {
      skippedSong = await this.subscriptionService.skipCurrentSong(
        interaction.guildId!,
      );
    }
    if (skippedSong) {
      await interaction.reply(`Skipped ${skippedSong.title}`);
    } else {
      const embed = new EmbedBuilder()
        .setColor('#880808')
        .setTitle('❌')
        .setDescription('There is nothing to skip!');
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
