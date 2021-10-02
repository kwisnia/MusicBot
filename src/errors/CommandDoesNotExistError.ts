export default class CommandDoesNotExistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandDoesNotExistError';
  }
}
