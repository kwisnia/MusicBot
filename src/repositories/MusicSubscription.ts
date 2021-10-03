import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { promisify } from 'util';
import { Logger } from 'winston';
import QueueIndexOutOfBoundsError from '../errors/QueueIndexOutOfBoundsError';
import { IAudioResourceFactory } from '../services/music/IAudioResourceFactory';
import { Track } from '../typings/Track';

const wait = promisify(setTimeout);

export default class MusicSubscription {
  public readonly audioPlayer: AudioPlayer;

  public queue: Track[];

  public loopSingle = false;

  public shuffle = false;

  private queueLock = false;

  private readyLock = false;

  private lastTrack: Track;

  public constructor(
    public readonly voiceConnection: VoiceConnection,
    private resourceFactory: IAudioResourceFactory,
    private logger: Logger,
  ) {
    this.audioPlayer = createAudioPlayer();
    this.queue = [];

    this.voiceConnection.on('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          /*
						If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
						but there is a chance the connection will recover itself if the reason of the disconnect was due to
						switching voice channels. This is also the same code for the bot being kicked from the voice channel,
						so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
						the voice connection.
					*/
          try {
            await entersState(
              this.voiceConnection,
              VoiceConnectionStatus.Connecting,
              5_000,
            );
            // Probably moved voice channel
          } catch {
            this.voiceConnection.destroy();
            // Probably removed from voice channel
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          /*
						The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
          this.voiceConnection.rejoin();
        } else {
          /*
						The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        /*
					Once destroyed, stop the subscription
				*/
        this.stop();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        /*
					In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
					before destroying the voice connection. This stops the voice connection permanently existing in one of these
					states.
				*/
        this.readyLock = true;
        try {
          await entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Ready,
            20_000,
          );
        } catch {
          if (
            this.voiceConnection.state.status !==
            VoiceConnectionStatus.Destroyed
          )
            this.voiceConnection.destroy();
        } finally {
          this.readyLock = false;
        }
      }
    });

    // Configure audio player
    this.audioPlayer.on('stateChange', async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.
        await this.processQueue();
        if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
          this.voiceConnection.destroy();
        }
      }
    });

    voiceConnection.subscribe(this.audioPlayer);
  }

  public get currentTrack(): Track | false {
    return (
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle &&
      (this.audioPlayer.state.resource as AudioResource<Track>).metadata
    );
  }

  public async enqueue(track: Track): Promise<void> {
    this.queue.push(track);
    await this.processQueue();
    this.logger.info(
      `Successfully added ${track.title} to queue in guild ${this.voiceConnection.joinConfig.guildId}`,
    );
    return Promise.resolve();
  }

  public stop(): Promise<void> {
    this.queueLock = true;
    this.queue = [];
    this.audioPlayer.stop(true);
    this.logger.info(
      `Stopping playback in guild ${this.voiceConnection.joinConfig.guildId}`,
    );
    return Promise.resolve();
  }

  public skip(): Promise<Track | null> {
    let currentTrack = null as Track | null;
    if (this.currentTrack) {
      currentTrack = this.currentTrack;
    }
    this.audioPlayer.stop();
    return Promise.resolve(currentTrack);
  }

  public pause(): Promise<void> {
    this.audioPlayer.pause();
    return Promise.resolve();
  }

  public resume(): Promise<void> {
    this.audioPlayer.unpause();
    return Promise.resolve();
  }

  public skipSelected(queueIndex: number): Promise<Track> {
    if (this.queue[queueIndex - 1]) {
      return Promise.resolve(this.queue.splice(queueIndex - 1, 1)[0]);
    }
    throw new QueueIndexOutOfBoundsError(
      `Queue index ${queueIndex} is out of bounds of queue of length ${this.queue.length}`,
    );
  }

  public changeLoopSingle(): Promise<boolean> {
    this.loopSingle = !this.loopSingle;
    this.logger.info(
      `Successfully changed loopSingle value in guild ${this.voiceConnection.joinConfig.guildId} to ${this.loopSingle}`,
    );
    return Promise.resolve(this.loopSingle);
  }

  public changeShuffle(): Promise<boolean> {
    this.shuffle = !this.shuffle;
    this.logger.info(
      `Successfully changed shuffle value in guild ${this.voiceConnection.joinConfig.guildId} to ${this.loopSingle}`,
    );
    return Promise.resolve(this.shuffle);
  }

  private async processQueue(): Promise<void> {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      (this.queue.length === 0 && !this.loopSingle)
    ) {
      return;
    }
    // Lock the queue to guarantee safe access
    this.queueLock = true;

    let nextTrack: Track;
    if (this.loopSingle) {
      nextTrack = this.lastTrack;
    } else if (this.shuffle) {
      const randomIndex = Math.floor(Math.random() * this.queue.length);
      [nextTrack] = this.queue.splice(randomIndex, 1);
      this.lastTrack = nextTrack;
    } else {
      nextTrack = this.queue.shift()!;
      this.lastTrack = nextTrack;
    }
    try {
      // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
      const resource = await this.resourceFactory.createFromTrack(nextTrack);
      this.audioPlayer.play(resource);
      this.logger.info(
        `Started playing ${nextTrack.title} in guild ${this.voiceConnection.joinConfig.guildId}`,
      );
      this.queueLock = false;
    } catch (error) {
      // If an error occurred, try the next item of the queue instead
      this.queueLock = false;
      this.processQueue();
    }
  }
}
