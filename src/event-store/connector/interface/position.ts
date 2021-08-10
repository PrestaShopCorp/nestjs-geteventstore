export declare type Position = {
  commit: bigint;
  prepare: bigint;

  // keeping retro compat
  commitPosition?: Long;
  preparePosition?: Long;
  start?: number;
  end?: number;
};
