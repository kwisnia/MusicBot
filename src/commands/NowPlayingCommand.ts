/* eslint-disable import/order */
import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  CommandInteraction,
  GuildMember,
  Message,
  MessageComponentInteraction,
  MessageEmbed,
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
    interaction: CommandInteraction,
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
      embed = new MessageEmbed()
        .setColor('#00FF00')
        .setTitle('Currently playing')
        .setDescription(currentStatus.currentTrack.title)
        .setThumbnail(currentStatus.currentTrack.thumbnailUrl ?? '')
        .addField(
          'Requested by',
          this.client.users.cache.get(currentStatus.currentTrack.requestedBy)
            ?.username || 'unknown',
        )
        .setFooter({
          text: `Loop: ${
            currentStatus.loopSingle ? 'enabled' : 'disabled'
          }\nShuffle: ${currentStatus.shuffle ? 'enabled' : 'disabled'}`,
        });
    } else {
      embed = new MessageEmbed()
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
