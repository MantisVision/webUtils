# SentryIntegration
This package provides an integration of @mantisvision/rysk* packages with bugtracking system [Sentry](https://sentry.io)

## Install
You can install this package using either of the following commands for either yarn or npm
```
yarn add @mantisvision/sentryintegration
npm install @mantisvision/sentryintegration
```

## Usage:
This package exposes a single class as its default export. 
It can be imported in your javascript file like this:
```javascript
import SentryIntegration from "@mantisvision/sentryintegration" //javascript native module style
const SentryIntegration = require("@mantisvision/sentryintegration"); // Node.js style
```
Instance of this class can be injected into Sentry during its init state:
```javascript
import * as Sentry from "@sentry/browser";
import SentryIntegration from "@mantisvision/sentryintegration";

Sentry.init({
	integrations: [new SentryIntegration({ measure:true })],
	/* the rest of Sentry config */
});
```
Constructor of the exported class can be called with a single parameter which contains settings object. Currently, the only
available option is ``measure`` which can be set to ``true`` or ``false`` to turn on/off sending of the statistics to
Sentry.

## Public API
SentryIntegration Exports a single class as its default export. An instance of this class should be passed to Sentry during its 
configuration. Method ``setupOnce`` is called automatically by Sentry.
```javascript
/**
 * Creates an instance of this class which should be passed to Sentry.
 * @param {Object} options configuration object which currently supports only one parameter: 
 *					measure -- if set to true, Transactions will be allowed in SentryInternal package, if false they won't
 */
constructor(options = null)
```

## Release notes

### 0.8.0
- ``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.
- Source codes have been rewritten to Typescript