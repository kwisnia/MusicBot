import {
  Client,
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  MessageComponentInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  VoiceChannel,
} from 'discord.js';
import { Logger } from 'winston';
import NoGuildError from '../errors/NoGuildError';
import UserNotInVoiceChannelError from '../errors/UserNotInVoiceChannelError';
import { ISubscriptionService } from '../services/music/ISubscriptionService';
import BaseCommand from '../services/interaction/BaseCommand';

export default class NowPlayingCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('np')
      .setDescription('Gives information about currently playing track');
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Stop command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command np was not called in a voice channel',
      );
    }
    const currentStatus = await this.subscriptionService.getSubscriptionStatus(
      interaction.guildId!,
    );
    let embed;
    if (currentStatus.currentTrack) {
      embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Currently playing')
        .setDescription(currentStatus.currentTrack.title)
        .setThumbnail(currentStatus.currentTrack.thumbnailUrl ?? '')
        .addFields([
          {
            name: 'Requested by',
            value:
              this.client.users.cache.get(
                currentStatus.currentTrack.requestedBy,
              )?.username || 'unknown',
          },
        ])
        .setFooter({
          text: `Loop: single - ${
            currentStatus.loopSingle ? 'enabled' : 'disabled'
          }, queue - ${
            currentStatus.loopAll ? 'enabled' : 'disabled'
          }\nShuffle: ${currentStatus.shuffle ? 'enabled' : 'disabled'}`,
        });
    } else {
      embed = new EmbedBuilder()
        .setColor('#880808')
        .setTitle('❌')
        .setDescription('Nothing is playing');
    }
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
