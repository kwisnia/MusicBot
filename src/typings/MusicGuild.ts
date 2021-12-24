import { Guild } from 'discord.js';
import { Track } from './Track';

export interface MusicGuild extends Guild {
  queue: Track[];
}
