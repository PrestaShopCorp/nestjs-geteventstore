export interface IStreamMetadata {
  // Optional Retention rules default keep for long time
  $maxAge?: number;
  $maxCount?: number;
  // Optional role access on event store
  permissions?: ['$admin'];
}
