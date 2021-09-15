import 'reflect-metadata';
import { Client, Intents } from 'discord.js';
import { Container } from 'inversify';
import * as winston from 'winston';
import BOT_TYPES from './botTypes';
import { IEventController } from './events/IEventController';
import EventController from './events/EventController';
import { ICommandRepository } from './repositories/ICommandRepository';
import CommandRepository from './repositories/CommandRepository';
import InteractionService from './services/interaction/InteractionService';
import { IInteractionService } from './services/interaction/IInteractionService';
import AudioResourceFactory from './services/music/AudioResourceFactory';
import SubscriptionService from './services/music/SubscriptionService';
import MusicSubscriptionRepository from './repositories/MusicSubscriptionRepository';
import TrackFactory from './services/music/TrackFactory';

const container = new Container();
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log' }),
  ],
  format: winston.format.printf(
    (log) => `[${log.level.toUpperCase()}] - ${log.message}`,
  ),
});

container.bind<Client>(BOT_TYPES.Client).toConstantValue(
  new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
    presence: {
      activities: [
        {
          name: 'Ekipa',
          type: 'LISTENING',
        },
      ],
    },
  }),
);
container.bind<winston.Logger>(BOT_TYPES.Logger).toConstantValue(logger);
container
  .bind<ICommandRepository>(BOT_TYPES.Repository.CommandRepository)
  .toConstantValue(new CommandRepository(logger));
container.bind<IEventController>(BOT_TYPES.EventController).to(EventController);
container
  .bind<IInteractionService>(BOT_TYPES.Service.Interaction.InteractionService)
  .to(InteractionService);
container
  .bind(BOT_TYPES.Service.Music.AudioResourceFactory)
  .to(AudioResourceFactory);
container.bind(BOT_TYPES.Service.Music.TrackFactory).to(TrackFactory);
container
  .bind(BOT_TYPES.Service.Music.SubscriptionService)
  .to(SubscriptionService);
container
  .bind(BOT_TYPES.Repository.MusicSubscriptionRepository)
  .to(MusicSubscriptionRepository);

export default container;
