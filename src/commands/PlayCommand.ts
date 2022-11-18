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
import * as player from 'play-dl';
import BaseCommand from '../services/interaction/BaseCommand';
import { Track } from '../typings/Track';
import { SpotifyTrack } from 'play-dl';

export default class PlayCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('play')
      .setDescription('Adds a given song to the queue')
      .addStringOption((option) =>
        option
          .setName('video_url')
          .setDescription('Video to play')
          .setRequired(true),
      ) as SlashCommandBuilder;
  }

  public async execute(
    interaction: CommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Play command called');
    await interaction.deferReply();
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command play was not called in a voice channel',
      );
    }
    let url = interaction.options.getString('video_url');
    let isPlaylist = false;
    if (!url) {
      await interaction.editReply({
        content: 'You must pass a link or a search phrase',
      });
      return Promise.resolve();
    }
    const youtubeCheck = player.yt_validate(url);
    const spotifyCheck = player.sp_validate(url);
    if (youtubeCheck === 'search' && spotifyCheck === 'search') {
      const searchResults = await player.search(url, {
        limit: 1,
        source: { youtube: 'video' },
      });
      if (!searchResults[0]) {
        await interaction.editReply({
          content: 'Nothing was found with the given search phrase :(',
        });
        return Promise.resolve();
      }
      url = searchResults[0].url!;
    }
    let addedSong: Track | undefined;

    if (spotifyCheck && spotifyCheck !== 'search') {
      if (player.is_expired()) {
        await player.refreshToken();
      }
      const trackData = await player.spotify(url);
      if (trackData instanceof SpotifyTrack) {
        const searchResults = await player.search(
          `${trackData.artists.map((artist) => artist.name).join(' ')} ${
            trackData.name
          } audio`,
          {
            limit: 1,
          },
        );
        url = searchResults[0].url!;
      } else {
        const addedSongs =
          await this.subscriptionService.enqueueSpotifyPlaylist(
            interaction.guildId!,
            channel,
            trackData,
            interaction.member.id,
          );
        [addedSong] = addedSongs;
        isPlaylist = true;
      }
    }

    if (youtubeCheck === 'playlist') {
      const addedSongs = await this.subscriptionService.enqueueYoutubePlaylist(
        interaction.guildId!,
        channel,
        url,
        interaction.member.id,
      );
      [addedSong] = addedSongs;
      isPlaylist = true;
  } else if (!addedSong) {
      addedSong = await this.subscriptionService.enqueueYoutubeSong(
        interaction.guildId!,
        channel,
        url,
        interaction.member.id,
      );
    }
    const queue = await this.subscriptionService.getGuildQueue(
      interaction.guildId!,
    );

    const embed = new MessageEmbed()
      .setColor('#00FF00')
      .setTitle(`Added ${isPlaylist ? 'playlist' : 'song'} to the queue`)
      .setDescription(
        `${addedSong.title} ${isPlaylist ? ' and other songs' : ''}`,
      )
      .setThumbnail(addedSong.thumbnailUrl ?? '')
      .addField(
        'Requested by',
        this.client.users.cache.get(addedSong.requestedBy)?.username ||
          'unknown',
      )
      .setFooter({
        text: queue.length
          ? `${isPlaylist ? 'Total queue length:' : 'Position in queue:'} ${
              queue.length
            }`
          : 'Playing now!',
      });

    await interaction.editReply({
      embeds: [embed],
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
