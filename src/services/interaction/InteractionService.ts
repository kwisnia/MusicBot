import { CommandInteraction, MessageComponentInteraction } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import BOT_TYPES from '../../botTypes';
import CommandDoesNotExistError from '../../errors/CommandDoesNotExistError';
import getErrorMessage from '../../errors/handleError';
import NoComponentHandlerError from '../../errors/NoComponentHandlerError';
import { ICommandRepository } from '../../repositories/ICommandRepository';
import { IInteractionService } from './IInteractionService';

@injectable()
class InteractionService implements IInteractionService {
  constructor(
    @inject(BOT_TYPES.Repository.CommandRepository)
    private commandRepository: ICommandRepository,
    @inject(BOT_TYPES.Logger) private logger: Logger,
  ) {}

  public async handleCreateCommand(
    interaction: CommandInteraction,
  ): Promise<void> {
    this.logger.info(`Command ${interaction.commandName} called`);
    const command = this.commandRepository.getCommand(interaction.commandName);
    if (!command) {
      throw new CommandDoesNotExistError('Command does not exist');
    }
    try {
      await command.execute(interaction);
      this.logger.info(
        `Command ${interaction.commandName} called successfully`,
      );
      return Promise.resolve();
    } catch (e) {
      if (interaction.deferred) {
        await interaction.editReply({
          content: getErrorMessage(e as Error),
        });
      } else {
        await interaction.reply({
          content: getErrorMessage(e as Error),
          ephemeral: true,
        });
      }
      return Promise.reject(e);
    }
  }

  public async handleMessageComponent(
    interaction: MessageComponentInteraction,
  ): Promise<void> {
    const commandName = interaction.customId.split('-')[0];
    this.logger.info(
      `Component for command ${commandName} clicked by ${interaction.user.username}`,
    );
    const command = this.commandRepository.getCommand(commandName);
    if (!command) {
      throw new CommandDoesNotExistError('Command does not exist');
    }
    if (command.handleComponentInteraction) {
      try {
        await command.handleComponentInteraction(interaction);
        this.logger.info(
          `Component ${interaction.customId} handled successfully`,
        );
        return Promise.resolve();
      } catch (e) {
        this.logger.error(e);
        await interaction.reply({
          content: 'There was an error while executing this interaction!',
          ephemeral: true,
        });
        return Promise.reject();
      }
    } else {
      throw new NoComponentHandlerError(
        "Command doesn't have component handler implemented",
      );
    }
  }
}

export default InteractionService;
