import { Snowflake, VoiceChannel } from 'discord.js';
import { SpotifyAlbum, SpotifyPlaylist } from 'play-dl/dist/Spotify/classes';
import { AudioPlayerInfo } from '../../typings/AudioPlayerStatus';
import { Track } from '../../typings/Track';

export interface ISubscriptionService {
  skipCurrentSong(guildId: string): Promise<Track | null>;
  skipSongInQueue(guildId: string, positionInQueue: number): Promise<Track>;
  getGuildQueue(guildId: string): Promise<Track[]>;
  getSubscriptionStatus(guildId: string): Promise<AudioPlayerInfo>;
  enqueueYoutubeSong(
    guildId: string,
    channel: VoiceChannel,
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track>;
  enqueueYoutubePlaylist(
    guildId: string,
    channel: VoiceChannel,
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track[]>;
  enqueueSpotifyPlaylist(
    guildId: string,
    channel: VoiceChannel,
    playlistData: SpotifyAlbum | SpotifyPlaylist,
    requestingUser: Snowflake,
  ): Promise<Track[]>;
  stopPlayback(guildId: string): Promise<void>;
  pausePlayback(guildId: string): Promise<void>;
  resumePlayback(guildId: string): Promise<void>;
  changeShuffle(guildId: string): Promise<boolean>;
  changeLoop(guildId: string): Promise<boolean>;
}
