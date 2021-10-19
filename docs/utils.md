# Utils
This package is meant to export objects, functions and classes aimed at developers of other packages.
SentryInternal object serves as an endpoint for SentryIntegration package and can be used as proxy to Sentry itself.
MantisLog handles log display setting for other packages.
AbstractRYSK is an abstract class foundation for RYSKUrl and RYSKStream.
registerCallbacks and callCallbacks are just helper functions meant solely as a dependency for RYSKUrl and RYSKStream.

## Install
You can install this package using either of the following commands for either yarn or npm
```
yarn add @mantisvision/utils
npm install @mantisvision/utils
```

## SentryInternal
By using this object, a developer of ``@mantisvision`` library doesn't have to care whether Sentry packages are used
in the final project or not.
Usage:
```javascript
import { SentryInternal as Sentry } from @mantisvision/utils

Sentry.addBreadcrumb({ /* breadcrumb config */ });
```

## MantisLog
Wraps logging to console and turns on/off diferent levels of logs. This object is used internally by some of @mantisvision packages.
Usage:
```javascript
import { MantisLog } from @mantisvision/utils

MantisLog.SetLogLevel(MantisLog.WARNINGS | MantisLog.ERRORS); //enabling and disabling logs is done using bitmask
MantisLog.warning("Some warning"); //internally uses console.warn()
```
## Public API

### SentryInternal
This object is supposed to be a singleton and is used to proxy Sentry calls. Methods ``setMeasure`` and ``init`` are
not to be called externally. They are meant as an injection point for Sentry through @mantisvision/sentryintegration
```javascript
/**
 * Proxy for Sentry.setTag
 */
setTag(name,value);
```
```javascript
/**
 * Proxy for Sentry.setUser
 */
setUser(user);
```
```javascript
/**
 * Proxy for Sentry.captureException
 */
captureException(err);
```
```javascript
/**
 * Proxy for Sentry.addBreadcrumb
 */
addBreadcrumb(breadCrumb);
```
```javascript
/**
 * Creates a new transaction object which allows to start Sentry transactions and measure time of spans within them.
 * @param {String} name specifies, how the newly created transaction should be called.
 * @return {Transaction|null} a new Transaction object or null, if transactions are turned off.
 */
createTransaction(name);
```
``createTransaction`` returns an object of an internal class ``Transaction`` which exposes these methods:
```javascript
/**
 * Constructor is called automatically by SentryInternal::createTransaction.
 */
constructor(name,hub);
```
```javascript
/**
 * Starts the transaction. If the transaction was already started, it finishes it and starts a new one. Internally, it
 * calls Sentry.startTransaction.
 */
begin();
```
```javascript
/**
 * Creates a new span within the transaction. Internally, it calls SentryTransaction.startChild and passes given 
 * parameters as its options object.
 */
startNewClock(op,data = null,description = "");
```
```javascript
/**
 * Finishes the last span within the transaction. Data about the duration of the span will be sent to Sentry only after
 * the entire transaction ends.
 */
stopLastClock();
```
```javascript
/**
 * Finishes the entire transaction. It first stops all spans which were not yet finished and then calls
 * SentryTransaction.finish() which causes the entire transaction to be sent to Sentry server.
 */
finish();
```

### MantisLog
This object is used by @mantisvision libraries to log into console.
```javascript
/**
 * Turns on/off logs which are logged using this object.
 * @param {integer} level bitmask made of MantisLog.WARNINGS (1), MantisLog.ERRORS (2) and/or MantisLog.DEBUG (4)
 */
SetLogLevel(level);
```
```javascript
/**
 * Wrapper around console.warn
 * @param {String} msg Message to log
 */
warning(msg);
```
```javascript
/**
 * Wrapper around console.error
 * @param {String} msg Message to log
 */
error(msg);
```
```javascript
/**
 * Wrapper around console.log
 * @param {String} msg Message to log
 */
debug(msg);
```
