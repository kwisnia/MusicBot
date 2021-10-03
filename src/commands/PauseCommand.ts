/* eslint-disable import/order */
import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  CommandInteraction,
  GuildMember,
  Message,
  MessageComponentInteraction,
  VoiceChannel,
} from 'discord.js';
import { Logger } from 'winston';
import NoGuildError from '../errors/NoGuildError';
import UserNotInVoiceChannelError from '../errors/UserNotInVoiceChannelError';
import { ISubscriptionService } from '../services/music/ISubscriptionService';
import BaseCommand from '../services/interaction/BaseCommand';

export default class PauseCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('pause')
      .setDescription('Pauses playback');
  }

  public async execute(
    interaction: CommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Pause command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command pause was not called in a voice channel',
      );
    }
    await this.subscriptionService.pausePlayback(interaction.guildId!);
    await interaction.reply(`⏸ **Playback paused**`);
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
