import {
  Equals,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsRFC3339,
  Matches,
  IsUrl,
} from 'class-validator';

/**
 * Event Store event metadata prepared to be transformed into cloudevents
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#overview
 */
export class EventMetadataDto {
  // Cloud Event Metadata
  /**
   * Specification Version
   * @readonly
   * @see https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#overview
   */
  @Equals(1)
  readonly specversion;

  /**
   * Timestamp of creation date
   * @example 1524379940
   */
  @IsRFC3339()
  time: number;

  /**
   * Typeof event. Note that "-" are not allowed, use "_" instead
   * <domain-extension>.<domain_name>.<service>.<event>.<event_version>
   * @example com.api.order.order_created.v2
   */
  @Matches(/(\w+\.){4}\w+/)
  type: string;

  /**
   * Identifier of the context in which an event happened, event source
   * An absolute URI is RECOMMENDED.
   * @example http://api-live.net/order/create
   * @example /order/create
   */
  @IsNotEmpty()
  @IsUrl()
  source: string;

  /**
   * Identifier in source context sub-structure, if any
   */
  @IsOptional()
  @IsNotEmpty()
  subject?: string;

  /**
   * Domain-specific information about the occurrence
   */
  @IsOptional()
  data?: any;

  /**
   * @see RFC 2046
   */
  @IsOptional()
  @IsNotEmpty()
  datacontenttype?: string;

  /**
   * Identifies the schema that data adheres to.
   * Incompatible changes to the schema SHOULD
   * be reflected by a different URI
   */
  @IsOptional()
  @IsUrl()
  dataschema?: string;

  // EventStore Specific (must be inside event-cloud data when transformed)
  /**
   * Event version
   * @example 1
   */
  @IsPositive()
  version: number;

  /**
   * Business process unique id
   * @example 15d5f8d5-869e-4107-9961-5035495fe416
   */
  @IsNotEmpty()
  correlation_id: string;
}
