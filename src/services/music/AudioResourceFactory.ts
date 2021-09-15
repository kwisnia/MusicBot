import { AudioResource, createAudioResource } from '@discordjs/voice';
import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import * as dlplayer from 'play-dl';
import { youtubeCookie } from '../../../config.json';
import BOT_TYPES from '../../botTypes';
import { Track } from '../../typings/Track';
import { IAudioResourceFactory } from './IAudioResourceFactory';

@injectable()
export default class AudioResourceFactory implements IAudioResourceFactory {
  public constructor(@inject(BOT_TYPES.Logger) private logger: Logger) {}

  public async createFromTrack(track: Track): Promise<AudioResource> {
    this.logger.info(`Creating new resource from track ${track.title}`);
    const stream = await dlplayer.stream(track.videoUrl, youtubeCookie);
    return createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
  }
}
