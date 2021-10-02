/* eslint-disable import/order */
import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageComponentInteraction,
  MessageEmbed,
  VoiceChannel,
} from 'discord.js';
import { Logger } from 'winston';
import NoGuildError from '../errors/NoGuildError';
import UserNotInVoiceChannelError from '../errors/UserNotInVoiceChannelError';
import { ISubscriptionService } from '../services/music/ISubscriptionService';
import BaseCommand from '../services/interaction/BaseCommand';

export default class StopCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
  ) {
    super(logger, subscriptionService);
    this.data = new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Stops bot playback');
  }

  public async execute(
    interaction: CommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Stop command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command stop was not called in a voice channel',
      );
    }
    await this.subscriptionService.stopPlayback(interaction.guildId!);
    const embed = new MessageEmbed()
      .setColor('#880808')
      .setTitle('🛑')
      .setDescription('Playback stopped');
    await interaction.reply({
      embeds: [embed],
    });
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
