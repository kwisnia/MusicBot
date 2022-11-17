import { Client } from 'discord.js';
import { Logger } from 'winston';
import * as http from 'http';
import container from './inversify.config';
import BOT_TYPES from './botTypes';
import { token } from '../config.json';
import { IEventController } from './events/IEventController';
import { ICommandRepository } from './repositories/ICommandRepository';

const client = container.get<Client>(BOT_TYPES.Client);
const eventController = container.get<IEventController>(
  BOT_TYPES.EventController,
);
const commandRepository = container.get<ICommandRepository>(
  BOT_TYPES.Repository.CommandRepository,
);
const logger = container.get<Logger>(BOT_TYPES.Logger);

(async () => {
  http
    .createServer((req, res) => {
      res.write("I'm alive");
      res.end();
    })
    .listen(8080);
  client.on('ready', () => {
    logger.info('The bot is online!');
    const activities = [`/play`, `/play`, `/play`];
    let i = 0;

    setInterval(() => {
      // eslint-disable-next-line no-plusplus
      client.user!.setActivity(`${activities[(i++ % activities.length)]}`, {
        type: 'LISTENING',
      });
    }, 5000);
  });
  client.on('debug', (m) => {
    logger.debug(m);
  });
  client.on('warn', (m) => {
    logger.warn(m);
  });
  client.on('error', (m) => {
    logger.error(m);
  });
  await eventController.bindEvents();
  await commandRepository.initCommands();
  process.on('uncaughtException', (error) => logger.error(error));
  await client.login(token);
})();
