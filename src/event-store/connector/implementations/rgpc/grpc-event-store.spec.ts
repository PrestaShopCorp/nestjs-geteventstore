import {RGPCEventStore} from './grpc-event-store';
import {IEventStoreConfig} from '../../../config';

describe('RGPCEventStore', () => {
    let eventStore: RGPCEventStore;

    beforeEach(() => {
        const conf: IEventStoreConfig = {
            credentials: undefined, http: undefined, tcpConnectionName: ''

        };
        eventStore = new RGPCEventStore(conf);
    });

    it('should be created', () => {
        expect(eventStore).toBeTruthy();
    });
});
