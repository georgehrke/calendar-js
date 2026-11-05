# :date: @nextcloud/calendar-js - Heart of the [Nextcloud calendar app](https://github.com/nextcloud/calendar)

[![npm](https://img.shields.io/npm/v/%40nextcloud%2Fcalendar-js?style=flat-square)](https://www.npmjs.com/package/@nextcloud/calendar-js) [![Build status](https://img.shields.io/github/actions/workflow/status/nextcloud-libraries/calendar-js/node-test.yml?style=flat-square)](https://github.com/nextcloud-libraries/calendar-js/actions/workflows/node-test.yml) [![Codecov branch](https://img.shields.io/codecov/c/gh/nextcloud-libraries/calendar-js/main?style=flat-square)](https://codecov.io/gh/nextcloud-libraries/calendar-js)

This library is a wrapper for [ICAL.js](https://github.com/mozilla-comm/ical.js/) that provides more convenient ways for editing.
Together with [cdav-library](https://github.com/nextcloud/cdav-library), it's the heart of the Nextcloud calendar app.

## Maintainers

* [@GVodyanov](https://github.com/GVodyanov)
* [@SebastianKrupinski](https://github.com/SebastianKrupinski)

## Developing

Please take note that this library has been developed solely for the purpose of using it in the Nextcloud calendar app.
Feel free to use it in your project, but don't expect any support / bugfixes / features.

### Setup
```bash
npm ci
```

### Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Releases

This repository follows the concept of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0).

Publishing a [GitHub release](https://github.com/nextcloud-libraries/calendar-js/releases) triggers the [Publish workflow](https://github.com/nextcloud-libraries/calendar-js/actions/workflows/npm-publish.yml), which builds and publishes the package to npm. The release tag must match the version in `package.json` (with an optional `v` prefix). Publishing uses the `npm-publish` environment and is subject to its configured protection rules.

## License

Calendar-js is licensed under the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html), version 3 or later. 
