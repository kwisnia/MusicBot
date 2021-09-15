import NoGuildError from './NoGuildError';
import SubscriptionNotFoundError from './SubscriptionNotFoundError';

const getErrorMessage = (error: Error): string => {
  switch (error.constructor) {
    case NoGuildError:
      return `You can't play music in direct messages!`;
    case SubscriptionNotFoundError:
      return 'You must join a voice channel to use this command!';
    default:
      return 'Something went wrong!';
  }
};

export default getErrorMessage;
