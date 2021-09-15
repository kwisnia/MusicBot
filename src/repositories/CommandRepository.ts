import { Collection } from 'discord.js';
import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { readdirSync } from 'fs';
import BOT_TYPES from '../botTypes';
import { ICommand } from '../services/interaction/ICommand';
import { ICommandRepository } from './ICommandRepository';

@injectable()
class CommandRepository implements ICommandRepository {
  private commandCollection: Collection<string, ICommand>;

  private commandFileList: string[];

  constructor(@inject(BOT_TYPES.Logger) private logger: Logger) {
    this.commandCollection = new Collection();
    this.commandFileList = readdirSync('./src/commands').filter((file) =>
      file.endsWith('.ts'),
    );
  }

  public async initCommands(): Promise<void> {
    this.logger.info('Init commands called');
    this.commandFileList.forEach(async (commandFile) => {
      const { default: command } = (await import(
        `../commands/${commandFile}`
      )) as { default: ICommand };
      this.commandCollection.set(command.data.name, command);
      this.logger.info(`Command ${command.data.name} loaded successfully`);
    });
    return Promise.resolve();
  }

  public getCommand(commandName: string): ICommand | undefined {
    return this.commandCollection.get(commandName);
  }

  public setCommand(name: string, command: ICommand): void {
    this.commandCollection.set(name, command);
  }
}

export default CommandRepository;
