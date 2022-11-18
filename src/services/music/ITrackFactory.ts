import { Snowflake } from 'discord-api-types';
import type { SpotifyTrack, YouTubeVideo } from 'play-dl';
import { Track } from '../../typings/Track';

export interface ITrackFactory {
  createYoutubeTrack(url: string, requestingUser: Snowflake): Promise<Track>;
  createSpotifyTrack(track: SpotifyTrack, requestingUser: Snowflake): Track;
  createYoutubePlaylistTrack(
    video: YouTubeVideo,
    requestingUser: Snowflake,
  ): Track;
}
