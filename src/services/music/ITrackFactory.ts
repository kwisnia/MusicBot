import { Snowflake } from 'discord-api-types';
import { Track } from '../../typings/Track';

export interface ITrackFactory {
  createTrack(url: string, requestingUser: Snowflake): Promise<Track>;
}
