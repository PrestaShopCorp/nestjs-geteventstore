export type EventStorePersistentSubscriptionConfig = {
  stream: string;
  group: string;
  options?: {
    resolveLinktos?: boolean,
    startFrom?: number,
    extraStatistics?: boolean,
    messageTimeout?: number,
    maxRetryCount?: number,
    liveBufferSize?: number,
    readBatchSize?: number,
    historyBufferSize?: number,
    checkPointAfter?: number,
    minCheckPointCount?: number,
    maxCheckPointCount?: number,
    maxSubscriberCount?: number,
    namedConsumerStrategy?: 'RoundRobin' | 'DispatchToSingle' | 'Pinned',
  },
  autoAck?: boolean | undefined;
  bufferSize?: number | undefined;

  onSubscriptionDropped?: (
    sub: EventStorePersistentSubscriptionConfig,
    reason: string,
    error: string,
  ) => void | undefined;
};

export type EventStoreCatchupSubscriptionConfig = {
  stream: string;
};
// TODO add config for startEvent
export type EventStoreVolatileSubscription = {
  stream: string;
};
