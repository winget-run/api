# winget-run api

The REST API behind [winget.run](https://winget.run), allowing users to search, discover, and install winget packages effortlessly without any third-party programs. Package manifests are periodically fetched from the GitHub API to prevent hitting ratelimits.

## Installation

A Docker image is built for the project in our CI/CD pipeline on the develop, release/* and master branches. These can be found [here](https://github.com/winget-run/api/packages/236685).

++ required env vars

A detailed example of building and running the project without docker can be found in the [development](#Development) section.

## Versioning



## Ratelimits

Info will be added here once ratelimiting has been implemented. Please don't kill our servers in the meantime.

## Authentication

The API is currently not available publicly but if you'd be interested in using it, please contact us :).

## Routes



## Development

```python
import foobar

foobar.pluralize('word') # returns 'words'
foobar.pluralize('goose') # returns 'geese'
foobar.singularize('phenomena') # returns 'phenomenon'
```

## Deployment

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Authors

- @dragon something something
- @ryan something something

## Acknowledgments
- @matt (for putting up with our bullshit)

## License
[MIT](https://choosealicense.com/licenses/mit/)
