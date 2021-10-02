import BaseCommand from '../services/interaction/BaseCommand';

export interface ICommandRepository {
  initCommands(): Promise<void>;
  getCommand(name: string): BaseCommand | undefined;
  setCommand(name: string, command: BaseCommand): void;
}
