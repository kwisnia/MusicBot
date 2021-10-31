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

  public async createTrack(
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track> {
    this.logger.info('Creating new track');
    const songInfo = await dlplayer.video_info(url);
    return Promise.resolve({
      title: songInfo.video_details.title!,
      videoUrl: url,
      length: +songInfo.video_details.durationInSec,
      thumbnailUrl: songInfo.video_details.thumbnail!.url!,
      requestedBy: requestingUser,
    });
  }
}
