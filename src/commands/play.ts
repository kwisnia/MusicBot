import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Message } from 'discord.js';
import { Logger } from 'winston';
import NoGuildError from '../errors/NoGuildError';
import UserNotInVoiceChannelError from '../errors/UserNotInVoiceChannelError';
import { ICommand } from '../services/interaction/ICommand';
import { ISubscriptionService } from '../services/music/ISubscriptionService';

export default class PlayCommand implements ICommand {
  public readonly data;

  public constructor(
    private logger: Logger,
    private subscriptionService: ISubscriptionService,
  ) {
    this.data = new SlashCommandBuilder()
      .setName('play')
      .setDescription('Zagraj coś')
      .addStringOption((option) =>
        option
          .setName('video_url')
          .setDescription('Video to play')
          .setRequired(true),
      ) as SlashCommandBuilder;
  }

  public async execute(
    interaction: CommandInteraction,
  ): Promise<Message | undefined | void> {
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel) {
      throw new UserNotInVoiceChannelError();
    }
    try {
      await entersState(
        subscription.voiceConnection,
        VoiceConnectionStatus.Ready,
        20e3,
      );
    } catch (error) {
      console.warn(error);
      await interaction.followUp(
        'Failed to join voice channel within 20 seconds, please try again later!',
      );
      return;
    }
    this.logger.info('Siema');
  }
}
