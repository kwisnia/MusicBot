/* eslint-disable import/order */
import { SlashCommandBuilder } from '@discordjs/builders';
import {
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
import * as player from 'play-dl';
import BaseCommand from '../services/interaction/BaseCommand';

export default class PlayCommand extends BaseCommand {
  public readonly data;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
  ) {
    super(logger, subscriptionService);
    this.data = new SlashCommandBuilder()
      .setName('play')
      .setDescription('Adds a given song to the queue')
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
    this.logger.info('Play command called');
    if (!(interaction.member instanceof GuildMember)) {
      throw new NoGuildError();
    }
    const { channel } = interaction.member.voice;
    if (!channel || !(channel instanceof VoiceChannel)) {
      throw new UserNotInVoiceChannelError(
        'Command play was not called in a voice channel',
      );
    }
    let url = interaction.options.getString('video_url');
    if (!url) {
      await interaction.reply({
        content: 'Nie podałeś linka...',
        ephemeral: true,
      });
      return Promise.resolve();
    }
    if (!player.yt_validate(url)) {
      const searchResults = await player.search(url, {
        limit: 1,
        type: 'video',
      });
      if (!searchResults[0]) {
        await interaction.reply({
          content: 'Nie udało się nic znaleźć z tym co podałeś :(',
          ephemeral: true,
        });
        return Promise.resolve();
      }
      url = searchResults[0].url as string;
    }
    const addedSong = await this.subscriptionService.enqueueYoutubeSong(
      interaction.guildId!,
      channel,
      url,
      interaction.member.id,
    );
    await interaction.reply(`Added to queue: ${addedSong.title}`);
    return Promise.resolve();
  }

  public async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void> {
    this.logger.info(`Play component clicked by ${interaction.user.id}`);
    return Promise.resolve();
  }
}
