import { IEvent } from '@nestjs/cqrs';
import { ESContext } from './es-context';

export default interface ESEvent extends IEvent {
  context: ESContext;
}
