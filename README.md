# Winget.run API

The REST API behind [winget.run](https://winget.run), allowing users to search, discover, and install winget packages effortlessly without any third-party programs. Package manifests are periodically fetched from the GitHub API to prevent hitting ratelimits.

If you wish to use our API, please take a look at [our docs](https://docs.winget.run). All other non-documentation info will be provided in this readme.

## Contents
- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Authors](#authors)
- [Acknowledgments](#acknowledgments)
- [License](#license)

## Installation

A Docker image is built for the project in our CI/CD pipeline on the develop, release/* and master branches. These can be found [here](https://github.com/winget-run/api/packages/236685). A detailed example of building and running the project without docker can be found in the [development](#Development) section.

> NOTE: We currently only support x509 MongoDB autnetication with TLS, we may modify this at a later date.

The following environment variabled are required to run the container:
- **MONGO_HOST**: MongoDB host.
- **MONGO_DB**: MongoDB database name.
- **MONGO_CERT**: MongoDB x509 cert.
- **MONGO_CA_PATH**: Path to MongoDB CA cert.
- **WEB_ADDRESS**: Host address for CORS.
- **WEBSERVER_LOGGER**: Enable logger (boolean).
- **WEBSERVER_PORT**: Port to run the API on.
- **WEBSERVER_ADDRESS**: Address to run the server on (eg. 0.0.0.0).
- **GITHUB_TOKEN**: GitHub API token.
- **CRON_FREQUENCY**: Cron notation for UPDATE_FREQUENCY_MINUTES (below).
- **UPDATE_FREQUENCY_MINUTES**: How often new packages are fetched from GitHub in minutes.
- **API_ACCESS_TOKEN**: Token that will be required for accessing protected routes.

> NOTE: The cron job is not included in this app and needs to be set up seperately.

## Development

Local development requires the following software:
- NodeJS
- Yarn
- MongoDB

The environment variables mentioned in the [installation](#Installation) section can be placed in a .env file in the project's root.

If everything is set up correctly, run the following command for an optimal development environment, which will watch for changes in the typescript files and auto-restart the server if necessary.
- `yarn build:watch`
- `yarn run:hot`

Tests and linting can be run using the following commands:
- `yarn test`
- `yarn lint`

For any additional commands, check out the package.json.

> NOTE: The MongoDB ORM that were using, typeorm, currently doesn't support TLS, making it work unfortunately required a monkey patch in /src/database/index.ts.

## Deployment

We use GitHub Actions CI/CD and Kubernetes for our deployments. All required into regarding deployments can be found in /.github and /chart.

## Contributing

Issues and pull requests are welcome. We currently don't have any templates (at the time of writing) so a pr for those would be nice as well. If you wish to check the progress of current tickets, we have boards set up using [ZenHub](https://www.zenhub.com/).

We currently don't have tests, but will add them soon™.

## Authors

- **Lukasz Niezabitowski** *(Dragon1320)*
- **Ryan Larkin** *(rlarkin212)*
- **Matthew Watt** *(MattheousDT)*

## Acknowledgments

- My beloved coffee machine for making glorious coffee in the morning (and night) and keeping me awake during these 12 hour programming sessions as we rushed to get this released.
- Certain things mentioned in our docs' introduction section and certain other things that I was not allowed to leave in but kept in source control anyway to amuse anyone who comes across it.

## License

Ask us if you want to use the code, or suggest a license and make a pr.
