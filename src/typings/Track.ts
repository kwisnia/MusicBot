import { Snowflake } from 'discord-api-types';

export interface Track {
  title: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  length: number;
  requestedBy: Snowflake;
}
