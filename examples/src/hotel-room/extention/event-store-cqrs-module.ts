import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import ESEventBus from './es-event-bus';
import ESEvent from './es-event';
import { EventsHandlers } from '../hotel-room.module';

export const EVENT_STORE_SUBSYSTEMS = Symbol();
export const EVENT_STORE_EVENTS_HANDLERS = Symbol();

@Module({
  imports: [CqrsModule],
  // providers: [ESEventBus],
  exports: [
    // ESEventBus,
    // EVENT_STORE_CONNECTOR,
    // EVENT_STORE_SUBSYSTEMS,
  ],
})
export default class EventStoreCqrsModule<EventBase extends ESEvent = ESEvent>
  implements OnApplicationBootstrap
{
  constructor(private readonly eventsBus: ESEventBus<EventBase>) {}

  // public static async connect(
  //   connectionString: string,
  //   esConfig: EsSubsystemConfiguration,
  //   eventHandlers: Type<IEventHandler>[],
  // ): Promise<DynamicModule> {
  //   const eventStoreConnector: Client =
  //     EventStoreDBClient.connectionString(connectionString);
  //   return {
  //     module: EventStoreCqrsModule,
  //     providers: [
  //       {
  //         provide: EVENT_STORE_CONNECTOR,
  //         useValue: eventStoreConnector,
  //       },
  //       {
  //         provide: EVENT_STORE_SUBSYSTEMS,
  //         useValue: esConfig,
  //       },
  //       {
  //         provide: EVENT_STORE_EVENTS_HANDLERS,
  //         useValue: eventHandlers,
  //       },
  //     ],
  //   };
  // }
  public onApplicationBootstrap(): void {
    this.eventsBus.register(EventsHandlers);
  }
}
