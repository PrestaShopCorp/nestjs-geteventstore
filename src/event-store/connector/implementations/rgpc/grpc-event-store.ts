import {Logger} from '@nestjs/common';
import {
    EventStoreCatchUpSubscription,
    EventStorePersistentSubscription,
    EventStoreSubscription,
    WriteResult,
} from 'node-eventstore-client';
import {
    PersistentSubscriptionAssertResult,
    PersistentSubscriptionOptions
} from 'geteventstore-promise';
import {Observable} from 'rxjs';

import {
    EventStoreProjection,
    IPersistentSubscriptionConfig,
    ISubscriptionStatus,
    IWriteEvent,
} from '../../../../interfaces';
import EventStoreConnector from '../../interface/event-store-connector';
import {IEventStoreConfig} from '../../../config';
import {EventStoreDBClient, FORWARDS, jsonEvent, START} from '@eventstore/db-client';
import {Client} from '@eventstore/db-client/dist/Client';
import {v4} from 'uuid';

export class RGPCEventStore implements EventStoreConnector {

    private logger: Logger = new Logger(this.constructor.name);
    private client: Client;

    constructor(private readonly config: IEventStoreConfig) {
        this.logger.log('Instantiating gRPC connector client');
    }

    public getConfig(): IEventStoreConfig {
        return this.config;
    }

    public assertPersistentSubscriptions(subscription: IPersistentSubscriptionConfig, options: PersistentSubscriptionOptions): Promise<PersistentSubscriptionAssertResult> {
        return Promise.resolve(undefined);
    }

    public assertProjection(projection: EventStoreProjection, content: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    public async connect(): Promise<void> {
        this.client =
            EventStoreDBClient.connectionString('esdb://localhost:20113?tls=false');
        const event = jsonEvent({
                                    id: v4(),
                                    type: "some-event",
                                    data: {
                                        id: "1",
                                        value: "some value",
                                    },
                                });

        const toto = this.client.subscribeToStream('$ce-hero');
        toto.on('close', () => console.log('toto closed'))
        const res = await this.client.appendToStream('$ce-hero', event);
        console.log('res : ', res);

        const events = await this.client.readStream('$ce-hero', {
            direction: FORWARDS,
            fromRevision: START,
            maxCount: 10
        });
        console.log('events : ', events);
    }

    public disconnect(): void {
    }

    public getPersistentSubscriptionInfo(subscription: IPersistentSubscriptionConfig): Promise<object> {
        return Promise.resolve(undefined);
    }

    public getSubscriptions(): { persistent: ISubscriptionStatus; catchup: ISubscriptionStatus } {
        return {catchup: undefined, persistent: undefined};
    }

    public isConnected(): boolean {
        return false;
    }

    public subscribeToCatchupSubscription(stream: string, onEvent: (sub, payload) => void, lastCheckpoint: number, resolveLinkTos: boolean, onSubscriptionStart: (subscription) => void, onSubscriptionDropped: (sub, reason, error) => void): Promise<EventStoreCatchUpSubscription | void> {
        return Promise.resolve(undefined);
    }

    public subscribeToPersistentSubscription(stream: string, group: string, onEvent: (sub, payload) => void, autoAck: boolean, bufferSize: number, onSubscriptionStart: (sub) => void, onSubscriptionDropped: (sub, reason, error) => void): Promise<EventStorePersistentSubscription> {
        return Promise.resolve(undefined);
    }

    public subscribeToVolatileSubscription(stream: string, onEvent: (sub, payload) => void, resolveLinkTos: boolean, onSubscriptionStart: (subscription) => void, onSubscriptionDropped: (sub, reason, error) => void): Promise<EventStoreSubscription> {
        return Promise.resolve(undefined);
    }

    public writeEvents(stream, events: IWriteEvent[], expectedVersion): Observable<WriteResult> {
        return undefined;
    }

    public writeMetadata(stream, expectedStreamMetadataVersion, streamMetadata: any): Observable<WriteResult> {
        return undefined;
    }

}
