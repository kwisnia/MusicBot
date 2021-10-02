export default class BotNotConnectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BotNotConnectedError';
  }
}
