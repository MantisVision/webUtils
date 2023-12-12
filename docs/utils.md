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

## VideoElement
This is essentially a wrapper around a classical HTMLVideo element. Its main purpose is to avoid conflicts between ``play``
and ``pause`` calls from user and a library. Since these calls are asynchronous, it might happen they get interrupted 
by one another. VideoElement attempts to solve this by ordering the calls in a meaningful way and potentially delaying them
till the promises from previous calls don't get resolved.

As the video source, one of the following three can be used:
- URL of a video file
- URL of m3u8 manifest file for HLS
- MediaStream 

Usage:
```javascript
import { VideoElement } from @mantisvision/utils

const video = new VideoElement();
video.setSource("video_url");

video.playUser(); //should be triggered by a user
video.playLib();  //should be triggered by a library
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
This class is used by @mantisvision libraries to log into console. The following methods can be called as static on the
MantisLog itself, or the class can be instantiated to create a new, independent logger.
```typescript
/**
 * Creates an independent instance of the Logger.
 * @param fgcolor HTML color code for the color of the text (applied only when using debug method!)
 * @param bgcolor HTML color code for the color of the background (applied only when using debug method!)
 * @param prefix optional string which will be prepended to every error, warning or debug log
 * @param prependTime if set to true, each log from this logger will be prepended by the time in format Hours:Minutes:Seconds.Miliseconds, default is false
 */
constructor(fgcolor?: string, bgcolor?: string, prefix?: string, prependTime?: boolean)
```
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
```typescript
/**
 * Wrapper around console.log
 * @param {string} msg Message to log
 * @param {string} fg color of the writing (optional) - this could be also boolean and in that case it is treated as the trace param
 * @param {string} bg color of the background (optional) - this could be also boolean and in that case it is treated as the trace param
 * @param {boolean} trace if set to true will output the stacktrace
 */
static debug(msg: string, fg?: string|boolean, bg?: string|boolean, trace?: boolean)
```

### VideoElement
This object is a wrapper around HTMLVideoElement and support video files, media streams and HLS.
```javascript
/**
 * Creates a new VideoElement object
 */
constructor();
```
```javascript	
/**
 * Returns the underlying HTMLVideoElement
 * @return {HTMLVideoElement}
 */
getElement();
```
```javascript	
/**
 * Set the source of the VideoElement. It can be either URL of a video file, URL of m3u8 manifest for the HLS or
 * a MediaStream.
 * @param {MediaStream|String} source for the underlying HTMLVideoElement
 */
async setSource(source);
```
```javascript	
/**
 * Jump to a point in time in the video
 * @param {float} timestamp in seconds where the video should jump
 */
jumpTo(timestamp);
```
```javascript	
/**
 * Returns duration of the video once the metada are loaded
 * @returns {float} duration of the video in seconds
 */
async getDuration();
```
```javascript	
/**
 * Checks whether the hls.js library is used.
 * @return {boolean} true if it is, false otherwise
 */
isHlsLibrary();
```
```javascript
/**
 * Checks whether the HLS is used
 * @returns {Boolean} true if it is, false otherwise
 */
isHls();
```
```javascript
/**
 * Attach event listener to the underlying HTMLVideo element.
 * @param event a name of the event from the HTMLVideo element. 
 *              It is also possible to attach a listener to "durationchange" event which is emitted each time the duration of the video changes
 * @param callback event listener to attach
 */
addEventListener(event, callback);
```
```javascript
/**
 * Detach event listener from the underlying HTMLVideo element.
 * @param event a name of the event from the HTMLVideo element. 
 *              It is also possible to detach a listener from the "durationchange" event.
 * @param callback event listener to detach
 */
removeEventListener(event, callback);
```
```javascript
/**
 * Sets the timestamp in which the video should begin its playback. 
 * @param timestamp the start of the video
 * @returns 
 */
setBeginning(timestamp);
```
```javascript
/**
 * Sets the timestamp in which the video should end its playback. 
 * @param timestamp the end of the video
 * @returns 
 */
setEnd(timestamp);
```
```javascript
/**
 * Getter and setter for the loop property of the video
 */
get loop();
set loop(val);
```
```javascript
/**
 * Getter and setter for the playbackRate property of the video
 */
get playbackRate();
set playbackRate(value);
```
```javascript
/**
 * Getter and setter for the muted property of the video
 */
get muted();
set muted(val);
```
```javascript
/**
 * Getter and setter for the volume property of the video
 */ 
get volume();
set volume(val);
```
```javascript
/**
 * Getter for ended property of the video
 */ 
get ended();
```
```javascript	
/**
 * Registers a listener for HLS events. It's basically a proxy for the same functionality from hls.js library. Be aware
 * that iOS Safari supports HLS natively and as such won't emit certain events specific for hls.js.
 * @param {String} event name of the event
 * @param {callable} func callback which gets triggered on the event
 */
onHlsEvent(event,func);
```
```javascript	
/**
 * Unregisters a callback from the HLS event.
 * @param {String} event name of the event
 * @param {callable} func callback which gets removed from the event
 */
offHlsEvent(event,func);
```
```javascript
/**
 * Similar to onHlsEvent, but the registered callback gets triggered only the first time the event occurs.
 * @param {String} event name of the event
 * @param {callable} func callback which gets triggered the first time the event occurs.
 */
onceHlsEvent(event,func);
```
```javascript	
/**
 * If a users wants to start playing the video, this method should be called. However, the video won't be
 * played if pauseLib() was called before. Only if both, libraries and the user, wish to play the video, the video
 * actually starts to play.
 */
async playUser();
```
```javascript	
/**
 * User who requests to pause the video should call this method. Pause has a higher priority than any play, so the
 * video is paused even if no library has requested it.
 */
async pauseUser();
```
```javascript	
/**
 * A library which uses VideoElement object and wants to play the video should call this method. However, the video won't be
 * played if pauseUser() was called before. Only if both, libraries and the user, wish to play the video, the video
 * actually starts to play.
 */
async playLib();
```
```javascript	
/**
 * Library which requests to pause the video should call this method. Pause has a higher priority than any play, so the
 * video is paused even if no user has requested it.
 */
async pauseLib();
```
```javascript	
/**
 * Alias for playLib method
 */
play();
```
```javascript	
/**
 * Alias for pauseLib method
 */
pause();
```
```javascript	
/**
 * Dispose the VideoElement. It is highly advisable to call this method after you finish using the object of this
 * class to help the garbage collector to efficiently free the memory.
 */
async dispose();
```
```javascript	
/**
 * Getter for the current time of the video.
 */
get currentTime(): number;
```
## Release notes

### 2.0.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

#### 2.0.2
Added an option to change the foreground and/or background colors of the debug logs in MantisLog object.

#### 2.0.3
Added a new typecheck export for data from the Worker.

#### 2.0.5
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability.

### 2.1.0.
Webpack configuration now emits dist files with ESM exports and imports.

### 2.2.0
Video element has a new getter for ``currentTime`` property.

### 2.3.0
- Video element has a couple of new methods and getters/setters for standard HTMLVideo element properties.
- Video element has two new special methods for setting the beginning (``setBeginning``) and the end (``setEnd``) timestamps of the vide to trim it to a desired length.
- the abstract class ``AbstractRYSK`` has a modified way to handle ``pause`` message from the worker. Now it checks whether the ``RYSKBuffer`` still waits for a frame and if it does, ``AbstractRYSK`` immediately sends ``continue`` message to the worker and the decoding continues.

#### 2.3.3
Fixed incorrect duration bug.

#### 2.3.4
Attempt at fixing jumps in case of videos using old RYSK format by better handling ``paused`` events from the worker.

#### 2.3.6
Fixed video not resetting _ended attribute after the first loop.

### 2.4.0
Added the fourth parameter to ``MantisLog.debug()`` -- the ``trace`` which makes the debug to output the trace log.
