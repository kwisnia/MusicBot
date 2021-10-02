export default class SubscriptionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionNotFoundError';
  }
}
