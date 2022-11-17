import { AudioResource, createAudioResource } from '@discordjs/voice';
import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import * as dlplayer from 'play-dl';
import BOT_TYPES from '../../botTypes';
import { Track } from '../../typings/Track';
import { IAudioResourceFactory } from './IAudioResourceFactory';

@injectable()
export default class AudioResourceFactory implements IAudioResourceFactory {
  public constructor(@inject(BOT_TYPES.Logger) private logger: Logger) {}

  public async createFromTrack(track: Track): Promise<AudioResource> {
    this.logger.info(`Creating new resource from track ${track.title}`);
    let stream;
    if (!track.videoUrl) {
      const foundTrack = await this.searchForTrack(track);
      stream = await dlplayer.stream(foundTrack.videoUrl!);
    } else {
      stream = await dlplayer.stream(track.videoUrl);
    }
    return createAudioResource(stream.stream, {
      metadata: track,
      inputType: stream.type,
      inlineVolume: true,
    });
  }

  private async searchForTrack(track: Track): Promise<Track> {
    this.logger.info(`Searching for track ${track.title}`);
    const searchResult = await dlplayer.search(`${track.title} audio`, {
      limit: 1,
      source: {
        youtube: 'video',
      },
    });
    const video = searchResult[0];
    if (!video) {
      return Promise.reject(new Error('No video found'));
    }
    return {
      ...track,
      videoUrl: video.url,
    };
  }
}
