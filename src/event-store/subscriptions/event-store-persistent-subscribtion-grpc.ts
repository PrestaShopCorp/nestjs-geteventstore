import EventStorePersistentSubscribtion from './event-store-persistent-subscribtion';
import {PersistentSubscription} from '@eventstore/db-client';

export default interface EventStorePersistentSubscribtionGrpc
    extends EventStorePersistentSubscribtion, PersistentSubscription {
}
