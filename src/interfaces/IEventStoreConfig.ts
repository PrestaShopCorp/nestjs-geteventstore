export interface IEventStoreConfig {
  credentials: {
    username: string;
    password: string;
  };
  tcp: {
    host: string;
    port: number;
  };
  http: {
    host: string;
    port: number;
  };
}
