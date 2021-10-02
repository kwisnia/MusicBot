export default class NoComponentHandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoComponentHandlerError';
  }
}
