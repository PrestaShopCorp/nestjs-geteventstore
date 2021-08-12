import { Position } from './position';

export interface AppendResult {
  success?: boolean;
  // typed Long for retro compat
  nextExpectedRevision?: bigint | Long;
  position?: Position;

  // keeping retro compat
  logPosition?: Position;
}
