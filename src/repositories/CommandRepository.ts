import { Client, Collection } from 'discord.js';
import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { readdirSync } from 'fs';
import BOT_TYPES from '../botTypes';
import BaseCommand, { ICommand } from '../services/interaction/BaseCommand';
import { ICommandRepository } from './ICommandRepository';
import { ISubscriptionService } from '../services/music/ISubscriptionService';

@injectable()
class CommandRepository implements ICommandRepository {
  private commandCollection: Collection<string, BaseCommand>;

  private commandFileList: string[];

  constructor(
    @inject(BOT_TYPES.Logger) private logger: Logger,
    @inject(BOT_TYPES.Service.Music.SubscriptionService)
    private subscriptionService: ISubscriptionService,
    @inject(BOT_TYPES.Client) private client: Client,
  ) {
    this.commandCollection = new Collection();
    this.commandFileList = readdirSync(
      `./${process.env.NODE_ENV === 'production' ? 'build/' : 'src/'}commands`,
    ).filter((file) =>
      file.endsWith(`${process.env.NODE_ENV === 'production' ? '.js' : '.ts'}`),
    );
  }

  public async initCommands(): Promise<void> {
    this.logger.info('Init commands called');
    this.commandFileList.forEach(async (commandFile) => {
      const { default: CommandClass } = (await import(
        `../commands/${commandFile}`
      )) as { default: ICommand };
      const newCommand = new CommandClass(
        this.logger,
        this.subscriptionService,
        this.client,
      );
      this.commandCollection.set(newCommand.data.name, newCommand);
      this.logger.info(`Command ${newCommand.data.name} loaded successfully`);
    });
    return Promise.resolve();
  }

  public getCommand(commandName: string): BaseCommand | undefined {
    return this.commandCollection.get(commandName);
  }

  public setCommand(name: string, command: ICommand): void {
    this.commandCollection.set(name, command);
  }
}

export default CommandRepository;
