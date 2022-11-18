import {
  Client,
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  MessageComponentInteraction,
  EmbedBuilder,
  VoiceChannel,
  SlashCommandBuilder,
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
    interaction: ChatInputCommandInteraction,
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
    let page = interaction.options.getInteger('page') ?? 1;

    const currentStatus = await this.subscriptionService.getSubscriptionStatus(
      interaction.guildId!,
    );
    let embed;
    if (currentStatus.currentTrack) {
      const totalPages = Math.ceil(currentStatus.queue.length / PAGE_SIZE);
      if (page > totalPages) {
        page = totalPages;
      }

      embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Playback queue')
        .addFields(
          {
            name: 'Currently playing',
            value: currentStatus.currentTrack.title,
            inline: true,
          },
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
            name: `Queue ${
              currentStatus.queue.length > 0
                ? `(page ${page} of ${totalPages})`
                : ''
            }`,
            value: currentStatus.queue.length
              ? currentStatus.queue
                  .slice(
                    (page - 1) * PAGE_SIZE,
                    (page - 1) * PAGE_SIZE + PAGE_SIZE,
                  )
                  .map(
                    (track, index) =>
                      `${(page - 1) * PAGE_SIZE + index + 1}. ${
                        track.title
                      } (requested by: ${
                        this.client.users.cache.get(track.requestedBy)
                          ?.username || 'unknown'
                      })`,
                  )
                  .join('\n') || 'Queue is empty 😥 Add some songs!'
              : 'Queue is empty 😥 Add some songs!',
          },
        )
        .setFooter({
          text: `Loop: single - ${
            currentStatus.loopSingle ? 'enabled' : 'disabled'
          }, queue - ${
            currentStatus.loopAll ? 'enabled' : 'disabled'
          }\nShuffle: ${currentStatus.shuffle ? 'enabled' : 'disabled'}`,
        });

      if (currentStatus.currentTrack.thumbnailUrl) {
        embed = embed.setThumbnail(currentStatus.currentTrack.thumbnailUrl);
      }
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
