import { ICommandHandler, IEventHandler, IQueryHandler } from '@nestjs/cqrs';
import { Type } from '@nestjs/common';

export default interface HandlersConfiguration {
  commands: Type<ICommandHandler>[];
  queries: Type<IQueryHandler>[];
  events: Type<IEventHandler>[];
}
