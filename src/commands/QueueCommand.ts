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

const PAGE_SIZE = 5;

export default class QueueCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('queue')
      .addIntegerOption((option) =>
        option
          .setName('page')
          .setDescription('Page number')
          .setRequired(false)
          .setMinValue(1),
      )
      .setDescription('Gives information about queue in current server');
  }

  public async execute(
    interaction: CommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Queue command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command queue was not called in a voice channel',
      );
    }
    const page = interaction.options.getInteger('page') ?? 1;

    const currentStatus = await this.subscriptionService.getSubscriptionStatus(
      interaction.guildId!,
    );
    let embed;
    if (currentStatus.currentTrack) {
      embed = new MessageEmbed()
        .setColor('#00FF00')
        .setTitle('Playback queue')
        .addField('Currently playing', currentStatus.currentTrack.title, true)
        .setThumbnail(currentStatus.currentTrack.thumbnailUrl)
        .addFields(
          {
            name: 'Requested by',
            value:
              this.client.users.cache.get(
                currentStatus.currentTrack.requestedBy,
              )?.username || 'unknown',
            inline: true,
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: `Queue (page ${page})`,
            value: currentStatus.queue.length
              ? currentStatus.queue
                  .slice(
                    page - 1 * PAGE_SIZE,
                    (page - 1) * PAGE_SIZE + PAGE_SIZE,
                  )
                  .map(
                    (track, index) =>
                      `${page - 1 * PAGE_SIZE + index + 1}. ${
                        track.title
                      } (requested by: ${
                        this.client.users.cache.get(track.requestedBy)
                          ?.username || 'unknown'
                      })`,
                  )
                  .join('\n')
              : 'Queue is empty 😥 Add some songs!',
          },
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
