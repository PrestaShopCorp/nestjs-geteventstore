import { Position } from './position';

export interface AppendResult {
  success: boolean;
  nextExpectedRevision: bigint;
  position?: Position;
}
