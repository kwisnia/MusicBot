import { Snowflake, VoiceChannel } from 'discord.js';
import { Track } from '../../typings/Track';

export interface ISubscriptionService {
  skipCurrentSong(guildId: string): Promise<Track | null>;
  skipSongInQueue(guildId: string, positionInQueue: number): Promise<Track>;
  getGuildQueue(guildId: string): Promise<Track[]>;
  enqueueYoutubeSong(
    guildId: string,
    channel: VoiceChannel,
    url: string,
    requestingUser: Snowflake,
  ): Promise<Track>;
  stopPlayback(guildId: string): Promise<void>;
  pausePlayback(guildId: string): Promise<void>;
  resumePlayback(guildId: string): Promise<void>;
}
