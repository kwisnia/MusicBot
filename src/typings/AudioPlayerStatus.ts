import { Track } from './Track';

export interface AudioPlayerInfo {
  currentTrack: Track | null;
  queue: Track[];
  shuffle: boolean;
  loopSingle: boolean;
}
