import { EventStoreProjection } from './projection';

export default interface EsSubsystemConfiguration {
  projections: EventStoreProjection[];
}
