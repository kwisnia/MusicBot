import MusicSubscription from './MusicSubscription';

export interface ISubscriptionRepository {
  getSubscriptionForGuild(guildId: string): MusicSubscription | undefined;
  addSubscription(guildId: string, subscription: MusicSubscription): void;
  removeSubscription(guildId: string): void;
}
