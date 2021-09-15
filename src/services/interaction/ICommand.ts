import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from 'discord.js';

export interface ICommand {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction): Promise<Message | undefined | void>;
  handleComponentInteraction?(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void>;
}
