import { inject, injectable } from 'inversify';
import * as dlplayer from 'play-dl';
import { Logger } from 'winston';
import { Snowflake } from 'discord.js';
import BOT_TYPES from '../../botTypes';
import { Track } from '../../typings/Track';
import { ITrackFactory } from './ITrackFactory';

@injectable()
export default class TrackFactory implements ITrackFactory {
  public constructor(@inject(BOT_TYPES.Logger) private logger: Logger) {}

  public async createYoutubeTrack(
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track> {
    this.logger.info('Creating new track');
    const songInfo = await dlplayer.video_basic_info(url);
    return Promise.resolve({
      title: songInfo.video_details.title!,
      videoUrl: url,
      length: +songInfo.video_details.durationInSec,
      thumbnailUrl: songInfo.video_details.thumbnails[0].url,
      requestedBy: requestingUser,
    });
  }

  public createSpotifyTrack(
    track: dlplayer.SpotifyTrack,
    requestingUser: Snowflake,
  ): Track {
    this.logger.info('Creating new track');
    return {
      title: `${track.artists.map((a) => a.name).join(', ')} - ${track.name}`,
      length: track.durationInSec,
      thumbnailUrl: track.thumbnail?.url,
      requestedBy: requestingUser,
    };
  }

  public createYoutubePlaylistTrack(
    video: dlplayer.YouTubeVideo,
    requestingUser: Snowflake,
  ): Track {
    this.logger.info('Creating new track');
    return {
      title: video.title ?? 'Unknown',
      videoUrl: video.url,
      length: video.durationInSec,
      thumbnailUrl: video.thumbnails[0].url,
      requestedBy: requestingUser,
    };
  }
}
