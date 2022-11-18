import {
  ChatInputCommandInteraction,
  Client,
  Message,
  MessageComponentInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { Logger } from 'winston';
import { ISubscriptionService } from '../music/ISubscriptionService';

export default abstract class BaseCommand {
  public data: SlashCommandBuilder;

  public constructor(
    protected logger: Logger,
    protected subscriptionService: ISubscriptionService,
    protected client: Client,
  ) {}

  public abstract execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<Message | undefined | void>;

  public abstract handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<Message | undefined | void>;
}

export interface ICommand extends BaseCommand {
  new (
    logger: Logger,
    subscribtionService: ISubscriptionService,
    client: Client,
  ): BaseCommand;
}
