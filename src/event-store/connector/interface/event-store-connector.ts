import {
    EventStoreProjection,
    IPersistentSubscriptionConfig, ISubscriptionStatus,
    IWriteEvent
} from '../../../interfaces';
import {Observable} from 'rxjs';
import {
    EventStoreCatchUpSubscription,
    EventStorePersistentSubscription,
    EventStoreSubscription,
    WriteResult
} from 'node-eventstore-client';
import {
    PersistentSubscriptionAssertResult,
    PersistentSubscriptionOptions
} from 'geteventstore-promise';
import {IEventStoreConfig} from '../../config';

export const EVENT_STORE_CONNECTOR = Symbol();

export default interface EventStoreConnector {

    getConfig(): IEventStoreConfig;

    connect(): Promise<void>;

    isConnected(): boolean;

    disconnect(): void;

    writeEvents(
        stream,
        events: IWriteEvent[],
        expectedVersion,
    ): Observable<WriteResult>;

    writeMetadata(
        stream,
        expectedStreamMetadataVersion,
        streamMetadata: any,
    ): Observable<WriteResult>;

    getSubscriptions():{
        persistent: ISubscriptionStatus;
        catchup: ISubscriptionStatus;
    };

    getPersistentSubscriptionInfo(subscription: IPersistentSubscriptionConfig): Promise<object>;

    subscribeToPersistentSubscription(
        stream: string,
        group: string,
        onEvent: (sub, payload) => void,
        autoAck: boolean,
        bufferSize: number,
        onSubscriptionStart: (sub) => void,
        onSubscriptionDropped: (sub, reason, error) => void,
    ): Promise<EventStorePersistentSubscription>;

    subscribeToVolatileSubscription(
        stream: string,
        onEvent: (sub, payload) => void,
        resolveLinkTos: boolean,
        onSubscriptionStart: (subscription) => void,
        onSubscriptionDropped: (sub, reason, error) => void
    ): Promise<EventStoreSubscription>;

    subscribeToCatchupSubscription(
        stream: string,
        onEvent: (sub, payload) => void,
        lastCheckpoint: number,
        resolveLinkTos: boolean,
        onSubscriptionStart: (subscription) => void,
        onSubscriptionDropped: (sub, reason, error) => void,
    ): Promise<EventStoreCatchUpSubscription | void>;

    assertProjection(projection: EventStoreProjection, content: string): Promise<void>;

    assertPersistentSubscriptions(
        subscription: IPersistentSubscriptionConfig,
        options: PersistentSubscriptionOptions
    ): Promise<PersistentSubscriptionAssertResult>;

}
