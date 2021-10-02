export default class UserNotInVoiceChannelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotInVoiceChannelError';
  }
}
