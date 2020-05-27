# Winget-run API

The REST API behind [winget.run](https://winget.run), allowing users to search, discover, and install winget packages effortlessly without any third-party programs. Package manifests are periodically fetched from the GitHub API to prevent hitting ratelimits.

## Contents
- [Winget-run API](#winget-run-api)
  - [Contents](#contents)
  - [Installation](#installation)
  - [Versioning](#versioning)
  - [Ratelimits](#ratelimits)
  - [Authentication](#authentication)
  - [Routes](#routes)
        - [GET /ghs/import](#get-ghsimport)
        - [GET /ghs/manualImport](#get-ghsmanualimport)
        - [GET /ghs/update](#get-ghsupdate)
        - [GET /ghs/manualUpdate](#get-ghsmanualupdate)
        - [GET /search](#get-search)
        - [GET /autocomplete](#get-autocomplete)
        - [GET /{org}](#get-org)
        - [GET /{org}/{pkg}](#get-orgpkg)
  - [Development](#development)
  - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [Authors](#authors)
  - [Acknowledgments](#acknowledgments)
  - [License](#license)

## Installation

A Docker image is built for the project in our CI/CD pipeline on the develop, release/* and master branches. These can be found [here](https://github.com/winget-run/api/packages/236685). A detailed example of building and running the project without docker can be found in the [development](#Development) section.

> NOTE: We currently only support x509 MongoDB autnetication with TLS, we will modify this at a later date.

The following environment variabled are required to run the container:
- MONGO_HOST: MongoDB address; ip:port
- MONGO_DB: MongoDB database
- MONGO_CERT: MongoDB x509 certificate
- WEB_ADDRESS: Host address for CORS
- WEBSERVER_LOGGER: Enable logger (boolean)
- WEBSERVER_PORT: Server port
- WEBSERVER_ADDRESS: Server address; x.y.z.w
- GITHUB_TOKEN: GitHub access token
- API_ACCESS_TOKEN: Token for protecting GET /v1/ghs/* routes

## Versioning

The API versions are defined as v{number}, where number represents any positive integer. Adding breaking changes requires an increase in the version number.

The version API version can be provided as follows: api.winget.run/{version}

## Ratelimits

Info will be added here once ratelimiting has been implemented. Please don't kill our servers in the meantime.

## Authentication

The API is currently not available publicly but if you'd be interested in using it, please contact us :).

## Routes

The routes shown here apply to the latest version of the API (v1 as of writing). Routes are listed in the order that they are declared; for example, going to /ghs/import won't trigger the /{org}/{pkg} route as the former is declared first.

Many responses feature fields from the winget manifests, the standards thereof can be obtained [here](https://github.com/microsoft/winget-cli/blob/master/doc/ManifestSpecv0.1.md). Unfortunately, at the time of writing, [some manifests](https://github.com/microsoft/winget-pkgs/blob/master/manifests/Microsoft/dotnet/5.0.100-preview.4.yaml) don't follow these (what are stardards anyway right?).

> NOTE (completeness): There is also a GET api.winget.run/ route which doesnt do anything but doesnt return a 404 either.

> NOTE (completeness): Both GET /ghs/import and GET /ghs/update require authentication and should not be called by users.

**Summary:**
- **Root:** api.winget.run
- **Version:** v1
- **Routes:**
  - GET /search
  - GET /autocomplete
  - GET /{org}
  - GET /{org}/{pkg}
  - GET /ghs/import
  - POST /ghs/manualImport
  - GET /ghs/update
  - GET /ghs/manualUpdate?since=ISO8601&&until=ISO8601

**Errors:**
- All error responses are json, structured as follows:
  - error:
    - type (ErrorType)
- ErrorType can have the following values:
  - validation_error
  - generic_client_error
  - generic_server_error
- All error responses are accompanied by the appropriate http codes

**Details:**
##### GET /ghs/import
- *Description:* Import all packages from the GitHub API.
- *Use cases:*
  - Initial import of all packages only.
- *Requirements:*
  - Headers:
    - xxx-access-token
- *Success*:
  - Body (string)

##### GET /ghs/manualImport
- *Description:* Import all packages from the body.
- *Use cases:*
  - Used to import packages that may have been missed.
- *Requirements:*
  - Headers:
    - xxx-access-token
  - Body (json): 
    - manifests (string[])
- *Success*:
  - Body (string)

##### GET /ghs/update
- *Description:* Update all current packages and fetch new ones from the GitHub API.
- *Use cases:*
  - Called periodically to sync our database with the winget package repo.
- *Requirements:*
  - Headers:
    - xxx-access-token
- *Success*:
  - Body (string)

##### GET /ghs/manualUpdate
- *Description:* Update all current packages and fetch new ones from the GitHub API between date range.
- *Use cases:*
  - Called to sync our database with the winget package repo between two dates.
- *Requirements:*
  - Headers:
    - xxx-access-token
  - Query:
    - since (ISO 8601)
    - until (ISO 8601)
- *Success*:
  - Body (string)

##### GET /search
- *Description:* Basic search route.
- *Use cases:* 
  - Search for winget packages
- *Requirements:*
  - Query:
    - name (string)
- *Optional:*
  - Query:
    - limit (number; 1-24)
    - page (number; 0+)
    - sort (string; Name | updatedAt)
    - order (number; 1 | -1)
- *Success*:
  - Body (json):
    - packages[limit]:
      - Id (string)
      - versions (string[])
      - latest:
        - Version (string)
        - Name (string)
        - Publisher (string)
        - Description (string)
    - total (number)

##### GET /autocomplete
- *Description:* Detailed search route.
- *Use cases:*
  - Search packages by the name > publisher > description fields, preferred in that order.
- *Requirements:*
  - Query:
    - query (string)
- *Success*:
  - Body (json):
    - packages[3]:
      - Id (string)
      - versions (string[])
      - latest:
        - Version (string)
        - Name (string)
        - Publisher (string)
        - Description (string)

##### GET /{org}
- *Description:* Search for all packages in the organisation.
- *Use cases:*
  - Needs to get all packages for a specific organisation.
- *Requirements:*
  - Params:
    - org (string; len 1+)
  - Query:
    - name (string)
- *Optional:*
  - Query:
    - limit (number; 1-24)
    - page (number; 0+)
- *Success*:
  - Body (json):
    - packages[limit]:
      - Id (string)
      - versions (string[])
      - latest:
        - Version (string)
        - Name (string)
        - Publisher (string)
        - Description (string)
    - total (number)

##### GET /{org}/{pkg}
- *Description:* Get detailed info for a specific package in the organisation.
- *Use cases:*
  - Require all package manifest info.
- *Requirements:*
  - Params:
    - org (string; len 1+)
  - Query:
    - name (string)
- *Optional:*
  - Query:
    - limit (number; 1-24)
    - page (number; 0+)
- *Success*:
  - Body (json):
    - packages[limit]:
      - Id (string)
      - versions (string[])
      - latest:
        - Version (string)
        - Name (string)
        - Publisher (string)
        - Description (string)
    - total (number)

## Development

Local development requires the following software:
- NodeJS
- Yarn
- MongoDB

The environment variables mentioned in the [installation](#Installation) section can be placed in a .env file in root.

If everything is set up correctly, run the following command for an optimal development environment, which will watch for changes in the typescript files and auto-restart the server if there have been any changes made.
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

Issues and pull requests are welcome. We currently don't have any templates (at the time of writing) so a pr for those would be nice as well. Current 'issues' are listed as TODOs in the code, we'll get around to fixing that shortly as well.

We currently don't have tests, but will add them soon™ after release and would appreciate if any pr code is tested.

## Authors

- **Lukasz Niezabitowski** *(Dragon1320)*
- **Ryan Larkin** *(rlarkin212)*
- **Matthew Watt** *(MattheousDT)*

## Acknowledgments

- My beloved coffee machine for making glorious coffee in the morning (and night) and keeping me awake during these 12 hour programming sessions as we rushed to get this released. 

## License

Ask us if you want to use the code, or suggest a license and make a pr.
