import { Client } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import BOT_TYPES from '../botTypes';
import { IInteractionService } from '../services/interaction/IInteractionService';
import { IEventController } from './IEventController';

@injectable()
class EventController implements IEventController {
  constructor(
    @inject(BOT_TYPES.Service.Interaction.InteractionService)
    private interactionService: IInteractionService,
    @inject(BOT_TYPES.Client) private client: Client,
    @inject(BOT_TYPES.Logger) private logger: Logger,
  ) {}

  public async bindEvents(): Promise<void> {
    this.logger.info('Binding events to handlers');
    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (!interaction) return;
        if (interaction.isCommand() && interaction.isChatInputCommand()) {
          await this.interactionService.handleCreateCommand(interaction);
          return;
        }
        if (interaction.isMessageComponent()) {
          await this.interactionService.handleMessageComponent(interaction);
        }
      } catch (e) {
        this.logger.error(e);
      }
    });
    return Promise.resolve();
  }
}

export default EventController;
