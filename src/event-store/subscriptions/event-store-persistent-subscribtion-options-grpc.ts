import EventStorePersistentSubscribtionOptions from './event-store-persistent-subscribtion-options';
import {PersistentSubscriptionSettings} from '@eventstore/db-client/dist/utils';

export default interface EventStorePersistentSubscribtionOptionsGrpc
    extends EventStorePersistentSubscribtionOptions, PersistentSubscriptionSettings {
}
