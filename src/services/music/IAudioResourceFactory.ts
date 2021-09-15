import { AudioResource } from '@discordjs/voice';
import { Track } from '../../typings/Track';

export interface IAudioResourceFactory {
  createFromTrack(track: Track): Promise<AudioResource>;
}
