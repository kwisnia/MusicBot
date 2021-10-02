import BotNotConnectedError from './BotNotConnectedError';
import NoGuildError from './NoGuildError';
import QueueIndexOutOfBoundsError from './QueueIndexOutOfBoundsError';
import SubscriptionNotFoundError from './SubscriptionNotFoundError';
import UserNotInVoiceChannelError from './UserNotInVoiceChannelError';

const getErrorMessage = (error: Error): string => {
  switch (error.constructor) {
    case NoGuildError:
      return `You can't play music in direct messages!`;
    case SubscriptionNotFoundError:
    case UserNotInVoiceChannelError:
      return 'You must join a voice channel to use this command!';
    case BotNotConnectedError:
      return 'The bot is not connected to a voice channel!';
    case QueueIndexOutOfBoundsError:
      return 'The given index is out of bounds of the queue';
    default:
      return 'Something went wrong!';
  }
};

export default getErrorMessage;
