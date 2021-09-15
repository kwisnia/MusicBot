import { Guild } from 'discord.js';
import { ISong } from './Track';

export interface MusicGuild extends Guild {
  queue: ISong[];
}
