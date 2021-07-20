import {
  DNSClusterOptions,
  GossipClusterOptions,
  SingleNodeOptions,
} from '@eventstore/db-client/dist/Client';

export default interface Connector {
  connectionString?: string;
  OptionSettings?: SingleNodeOptions | DNSClusterOptions | GossipClusterOptions;
}
