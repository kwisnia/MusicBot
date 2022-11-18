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

export default class LoopCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {
    super(logger, subscriptionService, client);
    this.data = new SlashCommandBuilder()
      .setName('shuffle')
      .setDescription('Enables shuffle');
  }

  public async execute(
    interaction: CommandInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info('Shuffle command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command shuffle was not called in a voice channel',
      );
    }
    const newValue = this.subscriptionService.changeShuffle(
      interaction.guildId!,
    );
    await interaction.reply(
      `🔂 **Shuffle ${newValue ? 'enabled' : 'disabled'}!**`,
    );
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
