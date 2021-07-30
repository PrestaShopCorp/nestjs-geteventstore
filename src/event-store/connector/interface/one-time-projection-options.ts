import { Credentials } from '@eventstore/db-client/dist/types';

export default interface CreateOneTimeProjectionOptions {
  credentials?: Credentials;
  requiresLeader?: boolean;
}
