import {
  DiscordGatewayAdapterCreator,
  joinVoiceChannel,
} from '@discordjs/voice';
import { Snowflake, VoiceChannel } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import * as player from 'play-dl';
import { SpotifyAlbum, SpotifyPlaylist } from 'play-dl';
import BOT_TYPES from '../../botTypes';
import BotNotConnectedError from '../../errors/BotNotConnectedError';
import { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import MusicSubscription from '../../repositories/MusicSubscription';
import { AudioPlayerInfo, LoopMode } from '../../typings/AudioPlayerStatus';
import { Track } from '../../typings/Track';
import { IAudioResourceFactory } from './IAudioResourceFactory';
import { ISubscriptionService } from './ISubscriptionService';
import { ITrackFactory } from './ITrackFactory';

@injectable()
export default class SubscriptionService implements ISubscriptionService {
  public constructor(
    @inject(BOT_TYPES.Logger) private logger: Logger,
    @inject(BOT_TYPES.Repository.MusicSubscriptionRepository)
    private subscriptionRepository: ISubscriptionRepository,
    @inject(BOT_TYPES.Service.Music.AudioResourceFactory)
    private audioResourceFactory: IAudioResourceFactory,
    @inject(BOT_TYPES.Service.Music.TrackFactory)
    private trackFactory: ITrackFactory,
  ) {}

  public async skipCurrentSong(guildId: string): Promise<Track | null> {
    this.logger.info('Skip song method called');
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Skip command called when bot was not connected',
      );
    }
    const skippedTrack = subscription.currentTrack;
    if (!skippedTrack) {
      return Promise.resolve(null);
    }
    this.logger.info(`Skipping ${skippedTrack.title} in guild ${guildId}`);
    await subscription.skip();
    return Promise.resolve(skippedTrack);
  }

  public async skipSongInQueue(
    guildId: string,
    positionInQueue: number,
  ): Promise<Track> {
    this.logger.info('Skip specific song method called');
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Skip command called when bot was not connected',
      );
    }
    const skippedTrack = await subscription.skipSelected(positionInQueue);
    return Promise.resolve(skippedTrack);
  }

  public async getGuildQueue(guildId: string): Promise<Track[]> {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Queue command called when bot was not connected',
      );
    }
    return Promise.resolve(subscription.queue);
  }

  public async getSubscriptionStatus(
    guildId: string,
  ): Promise<AudioPlayerInfo> {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Queue command called when bot was not connected',
      );
    }
    const currentStatus: AudioPlayerInfo = {
      currentTrack: subscription.currentTrack || null,
      queue: subscription.queue,
      loopSingle: subscription.loopSingle,
      shuffle: subscription.shuffle,
      loopAll: subscription.loopAll,
    };
    return Promise.resolve(currentStatus);
  }

  public async enqueueYoutubeSong(
    guildId: string,
    channel: VoiceChannel,
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track> {
    let subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guildId,
          adapterCreator: channel.guild
            .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        }),
        this.audioResourceFactory,
        this.logger,
      );
      this.subscriptionRepository.addSubscription(guildId, subscription);
    }
    const newTrack = await this.trackFactory.createYoutubeTrack(
      url,
      requestingUser,
    );
    subscription.enqueue(newTrack);
    return Promise.resolve(newTrack);
  }

  public async enqueueYoutubePlaylist(
    guildId: string,
    channel: VoiceChannel,
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track[]> {
    let subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guildId,
          adapterCreator: channel.guild
            .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        }),
        this.audioResourceFactory,
        this.logger,
      );
      this.subscriptionRepository.addSubscription(guildId, subscription);
    }
    const playlist = await player.playlist_info(url, { incomplete: true });
    await playlist?.fetch();
    const tracks: Track[] = [];
    Array.from({ length: playlist.total_pages }, (_, i) => i + 1).forEach(
      (pageNumber) => {
        const videoPage = playlist.page(pageNumber);
        videoPage.forEach((video) => {
          tracks.push(
            this.trackFactory.createYoutubePlaylistTrack(video, requestingUser),
          );
        });
      },
    );
    const createdTracks = await Promise.all(tracks);
    subscription.enqueueMany(createdTracks);
    return Promise.resolve(createdTracks);
  }

  public async enqueueSpotifyPlaylist(
    guildId: string,
    channel: VoiceChannel,
    playlistData: SpotifyAlbum | SpotifyPlaylist,
    requestingUser: Snowflake,
  ): Promise<Track[]> {
    let subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guildId,
          adapterCreator: channel.guild
            .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        }),
        this.audioResourceFactory,
        this.logger,
      );
      this.subscriptionRepository.addSubscription(guildId, subscription);
    }
    await playlistData.fetch();
    const tracks: Track[] = [];
    Array.from({ length: playlistData.total_pages }, (_, i) => i + 1).forEach(
      (pageNumber) => {
        playlistData
          .page(pageNumber)
          ?.map((video) =>
            tracks.push(
              this.trackFactory.createSpotifyTrack(video, requestingUser),
            ),
          );
      },
    );
    subscription.enqueueMany(tracks);
    return Promise.resolve(tracks);
  }

  public async stopPlayback(guildId: string): Promise<void> {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Stop command called when bot was not connected',
      );
    }
    await subscription.stop();
    return Promise.resolve();
  }

  public async pausePlayback(guildId: string): Promise<void> {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Pause command called when bot was not connected',
      );
    }
    await subscription.pause();
    return Promise.resolve();
  }

  public async resumePlayback(guildId: string): Promise<void> {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Resume command called when bot was not connected',
      );
    }
    await subscription.resume();
    return Promise.resolve();
  }

  public changeShuffle(guildId: string): boolean {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Resume command called when bot was not connected',
      );
    }
    return subscription.changeShuffle();
  }

  public changeLoop(guildId: string, mode: LoopMode): boolean {
    const subscription =
      this.subscriptionRepository.getSubscriptionForGuild(guildId);
    if (!subscription) {
      throw new BotNotConnectedError(
        'Resume command called when bot was not connected',
      );
    }
    if (mode === LoopMode.Track) {
      return subscription.changeLoopSingle();
    }
    return subscription.changeLoopAll();
  }
}
