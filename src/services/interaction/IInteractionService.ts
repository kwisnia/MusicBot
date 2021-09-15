import { MessageComponentInteraction, MessageInteraction } from 'discord.js';

export interface IInteractionService {
  handleCreateCommand(interaction: MessageInteraction): Promise<void>;
  handleMessageComponent(
    interaction: MessageComponentInteraction,
  ): Promise<void>;
}
