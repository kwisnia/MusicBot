const BOT_TYPES = {
  Bot: Symbol.for('Bot'),
  Client: Symbol.for('Client'),
  Logger: Symbol.for('Logger'),
  EventController: Symbol.for('EventController'),
  Repository: {
    MusicSubscriptionRepository: Symbol.for('MusicSubscriptionRepository'),
    CommandRepository: Symbol.for('CommandRepository'),
  },
  Service: {
    Interaction: {
      InteractionService: Symbol.for('InteractionService'),
    },
    Music: {
      AudioResourceFactory: Symbol.for('AudioResourceFactory'),
      TrackFactory: Symbol.for('TrackFactory'),
      SubscriptionService: Symbol.for('SubscriptionService'),
    },
  },
};

export default BOT_TYPES;
