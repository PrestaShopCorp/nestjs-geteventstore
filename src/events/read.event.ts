import { v4 } from 'uuid';
import { IMappedEventOptions, IReadEvent } from '../interfaces';

export abstract class ReadEvent implements IReadEvent {
  public metadata: IReadEvent['metadata'];
  public readonly eventId?: IReadEvent['eventId'];
  public readonly eventType?: string;
  public readonly eventNumber: number;
  protected readonly originalEventId: string;
  readonly eventStreamId: IReadEvent['eventStreamId'];

  protected constructor(
    public readonly data: any,
    options: IMappedEventOptions,
  ) {
    this.metadata = {
      ...{
        correlation_id: v4(),
        version: 1,
      },
      ...options.metadata,
    };
    this.eventId = options.eventId || v4();
    this.eventType = options.eventType || this.constructor.name;
    this.eventNumber = options.eventNumber;
    this.originalEventId = options.originalEventId;
    this.eventStreamId = options.eventStreamId;
  }

  getStream(): string {
    return this.eventStreamId;
  }

  getStreamCategory() {
    return this.eventStreamId.split('-')[0];
  }

  getStreamId() {
    return this.eventStreamId.replace(/^[^-]*-/, '');
  }
}
