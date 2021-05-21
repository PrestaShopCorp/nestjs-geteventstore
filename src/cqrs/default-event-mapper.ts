import { Logger } from '@nestjs/common';
import { ReadEventOptionsType, ReadEventBusConfigType } from '../interfaces';

export const defaultEventMapper = (
  allEvents: ReadEventBusConfigType['allowedEvents'],
) => {
  const logger = new Logger('Default Event Mapper');
  logger.log(`Will build events from ${Object.keys(allEvents).join(', ')}`);
  return ((data, options: ReadEventOptionsType) => {
    let className = `${options.eventType}`;
    if (allEvents[className]) {
      logger.log(
        `Build ${className} received from stream ${options.eventStreamId} with id ${options.eventId} and number ${options.eventNumber}`,
      );
      return new allEvents[className](data, options);
    }
    return null;
  }) as ReadEventBusConfigType['eventMapper'];
};
