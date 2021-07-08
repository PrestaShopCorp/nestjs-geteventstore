import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { v4 } from 'uuid';

import { EventOptionsType, IReadEvent, IWriteEvent } from '../interfaces';
import { Type } from 'class-transformer';
import { EventMetadataDto } from '../dto';

export abstract class EventStoreEvent<T = any, K = EventMetadataDto>
  implements IWriteEvent, IReadEvent {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @ValidateNested()
  @Type(({ newObject }) => {
    return Reflect.getMetadata('design:type', newObject, 'metadata');
  })
  metadata: Partial<K>; // we add partial to allow metadata auto-generation

  @ValidateNested()
  @Type(({ newObject }) => {
    // console.log(Reflect.getMetadata('design:type', newObject, 'data'));
    return Reflect.getMetadata('design:type', newObject, 'data');
  })
  public data: T;

  // just for read events
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly eventStreamId: IReadEvent['eventStreamId'] | undefined;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  public readonly eventNumber: IReadEvent['eventNumber'] | undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly originalEventId: IReadEvent['originalEventId'] | undefined;

  constructor(data: T, options?: EventOptionsType) {
    this.data = data;
    // metadata is added automatically in write events
    this.metadata = options?.metadata || {};
    this.eventId = options?.eventId || v4();
    this.eventType = options?.eventType || this.constructor.name;
    this.eventStreamId = options?.eventStreamId ?? undefined;
    this.eventNumber = options?.eventNumber ?? undefined;
    this.originalEventId = options?.originalEventId ?? undefined;
  }

  // Notice we force this helpers to return strings
  // to keep string typing (!undefined) on our subscriptions
  getStream(): string {
    return this.eventStreamId || '';
  }
  getStreamCategory(): string {
    return this.eventStreamId?.split('-')[0] ?? '';
  }
  getStreamId(): string {
    return this.eventStreamId?.replace(/^[^-]*-/, '') ?? '';
  }
}
