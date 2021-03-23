import { Logger } from '@nestjs/common';
import { IMappedEventOptions, IReadEventBusConfig } from '../interfaces';

export const defaultEventMapper = (
  allEvents: IReadEventBusConfig['allowedEvents'],
) => {
  const logger = new Logger('Default Event Mapper');
  logger.log(`Will build events from ${allEvents}`);
  return ((data, options: IMappedEventOptions) => {
    let className = `${options.eventType}Event`;
    if (allEvents[className]) {
      logger.log(
        `Build ${className} received from stream ${options.eventStreamId} with id ${options.eventId} and number ${options.eventNumber}`,
      );
      return new allEvents[className](data, options);
    }
    return null;
  }) as IReadEventBusConfig['eventMapper'];
};
