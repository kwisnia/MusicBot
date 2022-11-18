import { Track as TrackType } from './Track';

export enum LoopMode {
  Track = 'track',
  Queue = 'queue',
}

export interface AudioPlayerInfo {
  currentTrack: TrackType | null;
  queue: TrackType[];
  shuffle: boolean;
  loopSingle: boolean;
  loopAll: boolean;
}
