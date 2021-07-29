export interface PersistentSubscriptionOptions {
  resolveLinkTos?: boolean;
  startFrom?: number;
  extraStatistics?: boolean;
  messageTimeout?: number;
  maxRetryCount?: number;
  liveBufferSize?: number;
  readBatchSize?: number;
  historyBufferSize?: number;
  checkPointAfter?: number;
  minCheckPointCount?: number;
  maxCheckPointCount?: number;
  maxSubscriberCount?: number;
  namedConsumerStrategy?: string;
}
