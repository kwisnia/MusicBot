import { Snowflake } from 'discord.js';

export interface Track {
  title: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  length: number;
  requestedBy: Snowflake;
}
