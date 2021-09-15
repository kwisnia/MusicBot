import { Collection, Snowflake } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import BOT_TYPES from '../botTypes';
import { ISubscriptionRepository } from './ISubscriptionRepository';
import MusicSubscription from './MusicSubscription';

@injectable()
export default class MusicSubscriptionRepository
  implements ISubscriptionRepository
{
  private subscriptions = new Collection<Snowflake, MusicSubscription>();

  public constructor(@inject(BOT_TYPES.Logger) private logger: Logger) {}

  public getSubscriptionForGuild(
    guildId: string,
  ): MusicSubscription | undefined {
    this.logger.info(`Getting subscription for guild ${guildId}`);
    return this.subscriptions.get(guildId);
  }

  addSubscription(guildId: string, subscription: MusicSubscription): void {
    this.subscriptions.set(guildId, subscription);
  }

  removeSubscription(guildId: string): void {
    this.subscriptions.delete(guildId);
  }
}
