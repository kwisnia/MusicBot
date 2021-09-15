import { ICommand } from '../services/interaction/ICommand';

export interface ICommandRepository {
  initCommands(): Promise<void>;
  getCommand(name: string): ICommand | undefined;
  setCommand(name: string, command: ICommand): void;
}
