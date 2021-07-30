export class PersistentSubscriptionOptions {
  public resolveLinkTos?: boolean;
  public extraStats?: boolean;
  public messageTimeout?: number;
  public maxRetryCount?: number;
  public liveBufferSize?: number;
  public readBatchSize?: number;
  public historyBufferSize?: number;
  public minCheckPointCount?: number;
  public fromRevision?: 'start' | 'end' | bigint;
  public maxSubscriberCount?: 'unlimited' | number;
  public checkPointAfter?: number;
  public maxCheckPointCount?: number;
  public namedConsumerStrategy?:
    | 'dispatch_to_single'
    | 'round_robin'
    | 'pinned';

  /**
   * The following parameters are deprecated. We keep them just to keep retro compat
   * with previous connector version
   */
  startFrom?: number;
  extraStatistics?: boolean;

  public static getDefaultOptions(): PersistentSubscriptionOptions {
    return {
      resolveLinkTos: false,
      extraStats: false,
      fromRevision: 'start',
      messageTimeout: 30_000,
      maxRetryCount: 10,
      maxSubscriberCount: 'unlimited',
      liveBufferSize: 500,
      readBatchSize: 20,
      historyBufferSize: 500,
      namedConsumerStrategy: 'round_robin',
      checkPointAfter: 2_000,
      maxCheckPointCount: 1_000,
      minCheckPointCount: 10,
    };
  }
}
