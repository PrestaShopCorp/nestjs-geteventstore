import {
  Equals,
  IsNotEmpty,
  IsPositive,
  IsRFC3339,
  IsUrl,
  Matches,
} from 'class-validator';
/**
 * @todo add optional attributes
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#overview
 */
export class EventMetadataDto {
  /**
   * Specification Version
   * @readonly
   * @see https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#overview
   */
  @Equals(1)
  readonly specversion;

  /**
   * Event version
   * @example 1
   */
  @IsPositive()
  version: number;

  /**
   * Timestamp of creation date
   * @example 1524379940
   */
  @IsRFC3339()
  time: number;

  /**
   * Business process unique id
   * @example 15d5f8d5-869e-4107-9961-5035495fe416
   */
  @IsNotEmpty()
  correlation_id: string;

  /**
   * Typeof event: (<reverse-DNS-Name>).(<service>.)?(<command>.)?(<event-type>.)?(<event-version>)
   * @example com.my-api.my-service-v1.my-command.my-event.v2
   */
  @Matches(/(\w+\.)(\w+\.){0,3}(\w+)/)
  type: string;

  /**
   * Identifier of the context in which an event happened.
   * An absolute URI is RECOMMENDED.
   * @example http://api-live-checkout.psessentials.net/payments/order/create
   * @example /payments/order/create
   */
  @IsNotEmpty()
  @IsUrl()
  source: string;
}
