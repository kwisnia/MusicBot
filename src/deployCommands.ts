import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { APIApplicationCommandOption, Routes } from 'discord-api-types/v9';
import * as winston from 'winston';
import { clientId, token } from '../config.json';
import container from './inversify.config';
import BOT_TYPES from './botTypes';
import { ISubscriptionService } from './services/music/ISubscriptionService';
import { ICommand } from './services/interaction/BaseCommand';

interface ISlashCommandJSON {
  name: string;
  description: string;
  options: APIApplicationCommandOption[];
  // eslint-disable-next-line camelcase
  default_permission: boolean | undefined;
}

const commands: ISlashCommandJSON[] = [];
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log' }),
  ],
  format: winston.format.printf(
    (log) => `[${log.level.toUpperCase()}] - ${log.message}`,
  ),
});
const subscriptionService = container.get<ISubscriptionService>(
  BOT_TYPES.Service.Music.SubscriptionService,
);
const commandFiles = fs
  .readdirSync('./src/commands')
  .filter((file) => file.endsWith('.ts'));
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    // eslint-disable-next-line no-restricted-syntax
    for await (const file of commandFiles) {
      const { default: CommandClass } = (await import(
        `./commands/${file}`
      )) as {
        default: ICommand;
      };
      const newCommand = new CommandClass(logger, subscriptionService);
      commands.push(newCommand.data.toJSON());
    }
    await rest.put(
      Routes.applicationGuildCommands(clientId, '791288006967033876'),
      {
        body: commands,
      },
    );

    logger.info('Successfully registered application commands.');
  } catch (error) {
    logger.error(error);
  }
})();
