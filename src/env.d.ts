declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "prod" | "dev" | "test";
    NODE_PATH: string;

    MONGO_HOST: string;
    MONGO_DB: string;
    MONGO_CERT: string;
    MONGO_CA_PATH: string;
    // set automatically when running tests
    MONGO_URL: string;

    WEB_ADDRESS: string;
    WEBSERVER_LOGGER: string;
    WEBSERVER_PORT: string;
    WEBSERVER_ADDRESS: string;

    GITHUB_TOKEN: string;
    CRON_FREQUENCY: string;
    UPDATE_FREQUENCY_MINUTES: string;

    API_ACCESS_TOKEN: string;
  }
}
