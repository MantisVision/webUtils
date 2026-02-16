# Utils
This package is meant to export objects, functions and classes aimed at developers of other packages.  
- `SentryInternal` object serves as an endpoint for the `@mantisvision/sentryintegration` package and can be used as proxy to Sentry itself.  
- `MantisLog` handles log display setting for other packages.
- `AbstractRYSK` is an abstract class foundation for `RYSKUrl`, `RYSKStream` and `SplatUrl`.
- `registerCallbacks` and `callCallbacks` are just helper functions meant solely as a dependency for `RYSKUrl` and `RYSKStream`.
- `MediaElement` and its descendants `VideoElement` and `AudioElement` are wrappers around `HTMLMediaElement`

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/utils
npm install @mantisvision/utils
```

## SentryInternal
By using this object, a developer of `@mantisvision` library doesn't have to care whether Sentry packages are used
in the final project or not.
Usage:
```javascript
import { SentryInternal as Sentry } from @mantisvision/utils

Sentry.addBreadcrumb({ /* breadcrumb config */ });
```

## MantisLog
Wraps logging to the browser console and turns on/off different levels of logs. This object is used internally by some of `@mantisvision` libraries.  
It is also possible to specify color of the text and background to visually distinguish logs.
Usage:
```javascript
import { MantisLog } from "@mantisvision/utils";

MantisLog.SetLogLevel(MantisLog.WARNINGS | MantisLog.ERRORS | MantisLog.DEBUG); //enabling and disabling logs is done using bitmask
MantisLog.warning("Some warning"); //internally uses console.warn()
MantisLog.debug("A debug message", "red", "yellow"); //the log message in the console is going to have red text and a yellow background
```

In order to avoid constantly setting colors in each debug log message, you can create a dedicated MantisLog object and use that one. With custom logger, you can also specify whether to prepend every message with some string and/or time in the format "Hours:Minutes:Seconds.Milliseconds".
```javascript
import { MantisLog } from "@mantisvision/utils";

MantisLog.SetLogLevel(MantisLog.WARNINGS | MantisLog.ERRORS | MantisLog.DEBUG);
const customLogger = new MantisLog("white", "black", "RENDERING: ", true);
//the message in the console will begin with the datetime, followed by "RENDERING: " 
customLogger.debug("Test message");
```

The static `MantisLog.SetLogLevel` method is applied globally to all logger instances, including the main one, unless the custom instance specifies its own log level:
```javascript
import { MantisLog } from "@mantisvision/utils";

MantisLog.SetLogLevel(MantisLog.ERRORS);
const customLogger = new MantisLog("darkgreen");
customLogger.SetLogLevel(MantisLog.WARNINGS | MantisLog.ERRORS | MantisLog.DEBUG);

MantisLog.debug("This message won't be printed");
customLogger.debug("This message will be printed");
```

## MediaElement
An abstract class which can be used to implement a media element part of the volumetric playback. Currently there are two classes which extend it:

### VideoElement
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
import { VideoElement } from "@mantisvision/utils";

const video = new VideoElement();
video.setSource("video_url");

video.playUser(); //should be triggered by a user
video.playLib();  //should be triggered by a library
```

### AudioElement
Similar to [VideoElement](#videoelement), this class wraps HTMLAudio element. Contrary to video element it doesn't support HLS.

## Public API

### SentryInternal
This object is supposed to be a singleton and is used to proxy Sentry calls. Methods ``setMeasure`` and ``init`` are
not to be called externally. They are meant as an injection point for Sentry through `@mantisvision/sentryintegration`
```javascript
/**
 * Proxy for Sentry.captureException
 */
captureException(err);
```

### MantisLog
This class is used by mantisvision libraries to log into console. The following methods can be called as static on the
`MantisLog` itself, or the class can be instantiated to create a new, independent logger.
```typescript
/**
 * Creates an independent instance of the Logger.
 * @param fgcolor HTML color code for the color of the text (applied only when using debug method!)
 * @param bgcolor HTML color code for the color of the background (applied only when using debug method!)
 * @param prefix optional string which will be prepended to every error, warning or debug log
 * @param prependTime if set to true, each log from this logger will be prepended by the time in format Hours:Minutes:Seconds.Milliseconds, default is false
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
debug(msg: string, trace?: boolean): void;
debug(msg: string, fg: string, trace?: boolean): void;
debug(msg: string, fg: string|boolean|undefined, bg: string|boolean, trace?: boolean): void;
```

### MediaElement
An abstract class which should serve as a wrapper around media part of the volumetric playback.
```javascript
/**
 * Creates a new MediaElement object
 */
constructor();
```
```typescript
/**
 * Returns the underlying HTMLMediaElement
 * @return 
 */
getElement(): MediaElementType|null
```
```typescript
/**
 * Attach event listener to the underlying HTMLMediaElement.
 * @param event a name of the event from the HTMLMediaElement. 
 *              It is also possible to attach a listener to "durationchange" event which is emitted each time the duration of the media changes
 * @param callback event listener to attach
 */
addEventListener(event: string, callback: (event: any) => void)	
```
```typescript
/**
 * Detach event listener from the underlying HTMLMediaElement.
 * @param event a name of the event from the HTMLMediaElement. 
 *              It is also possible to detach a listener from the "durationchange" event.
 * @param callback event listener to detach
 */
removeEventListener(event: string, callback: (event: any) => void);
```
```typescript
/**
 * Set the source of the HTMLMediaElement. It can be either URL of an media file or a MediaStream.
 * @param {MediaStream|string} source for the underlying HTMLMediaElement
 */
async setSource(source: MediaStream|string);
```
```typescript
/**
 * Jump to a point in time in the media
 * @param {number} timestamp in seconds where the media should jump
 */
jumpTo(timestamp: number);
```
```typescript
/**
 * Returns duration of the media once the metadata are loaded
 * @returns {Promise<number>} duration of the media in seconds
 */
async getDuration(): Promise<number>;
```
```typescript
/**
 * If a users wants to start playing the media, this method should be called. However, the media won't be
 * played if pauseLib() was called before. Only if both, libraries and the user, wish to play the media, the media
 * actually starts to play.
 */
async playUser();
```
```typescript
/**
 * User who requests to pause the media should call this method. Pause has a higher priority than any play, so the
 * media is paused even if no library has requested it.
 */
async pauseUser();
```
```typescript
/**
 * A library which uses MediaElement object and wants to play the media should call this method. However, the media won't be
 * played if pauseUser() was called before. Only if both, libraries and the user, wish to play the media, the media
 * actually starts to play.
 */
async playLib();
```
```typescript
/**
 * Library which requests to pause the media should call this method. Pause has a higher priority than any play, so the
 * media is paused even if no user has requested it.
 */
async pauseLib();
```
```typescript
/**
 * Alias for playLib method
 */
async play();
```
```typescript
/**
 * Alias for pauseLib method
 */
async pause();
```
```typescript
/**
 * Dispose the MediaElement. It is highly advisable to call this method after you finish using the object of this
 * class to help the garbage collector to efficiently free the memory.
 */
async dispose();
```
```typescript
/**
 * Sets the timestamp in which the media should begin its playback. 
 * @param timestamp the start of the media
 * @returns 
 */
setBeginning(timestamp: number): this;
```
```typescript
	/**
	 * Sets the timestamp in which the media should end its playback. 
	 * @param timestamp the end of the media
	 * @returns 
	 */
	setEnd(timestamp: number): this;
```
```typescript
/**
 * Getter for the current time of the media.
 */
get currentTime(): number;
```
```typescript
/**
 * Getter for the real current timestamp of the underlying media element. It can be used for the real time synchronization
 * without the beginning/end crop.
 */
get absoluteCurrentTime();
```
```typescript
/**
 * Get the current loop property of the media
 */
get loop(): boolean
```
```typescript
/**
 * Set the loop property of the media.
 */
set loop(val: boolean);
```
```typescript
/**
 * Set the playbackRate property of the media.
 */
set playbackRate(value: number);
```
```typescript
/**
 * Set the muted property of the media.
 */
set muted(val: boolean);
```
```typescript
/**
 * Get the muted property of the media.
 */
get muted(): boolean;
```
```typescript
/**
 * Set the volume property of the media.
 */
set volume(val: number);
```
```typescript
/**
 * Get the volume property of the media.
 */
get volume(): number;
```
```typescript
/**
 * Check whether the media has ended.
 */	
get ended(): boolean;
```

### VideoElement
This is a wrapper around HTMLVideoElement and supports video files, media streams and HLS. The class inherits from the [MediaElement](#mediaelement) class and adds the following methods.
```typescript
/**
 * Set the source of the VideoElement. It can be either URL of a video file, URL of m3u8 manifest for the HLS or
 * a MediaStream.
 * @param source for the underlying HTMLVideoElement
 */
async setSource(source: MediaStream|string);
```
```typescript	
/**
 * Checks whether the hls.js library is used.
 * @return {boolean} true if it is, false otherwise
 */
isHlsLibrary(): boolean;
```
```typescript	
/**
 * Checks whether the HLS is used
 * @returns {Boolean} true if it is, false otherwise
 */
isHls(): boolean;
```
```typescript	
/**
 * Registers a listener for HLS events. It's basically a proxy for the same functionality from hls.js library. Be aware
 * that Safari supports HLS natively and as such won't emit events specific for hls.js.
 * @param {string} event name of the event
 * @param {callable} func callback which gets triggered on the event
 */
onHlsEvent(event: Parameters<Hls["on"]>[0],func: Parameters<Hls["on"]>[1]): this;
```
```typescript	
/**
 * Unregisters a callback from the HLS event.
 * @param {keyof HlsListeners} event name of the event
 * @param {Parameters<Hls["on"]>[1]} func callback which gets removed from the event
 */
offHlsEvent(event: Parameters<Hls["off"]>[0],func: Parameters<Hls["off"]>[1]): this;
```
```typescript	
/**
 * Similar to onHlsEvent, but the registered callback gets triggered only the first time the event occurs.
 * @param {keyof HlsListeners} event name of the event
 * @param {Parameters<Hls["once"]>[1]} func callback which gets triggered the first time the event occurs.
 */
onceHlsEvent(event: Parameters<Hls["once"]>[0],func: Parameters<Hls["once"]>[1]): this;
```
### AudioElement
This class doesn't provide any public method atop of [MediaElement](#mediaelement-1).

### AbstractRYSK
This is a baseline the developers of mantisvision libraries, currently used in `RYSKUrl`, `RYSKStream` and `SplatUrl`.

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

### 3.0.0
Added AudioElement for the SPLINTER volumetric playback.

### 4.0.0
Big code refactoring in `AbstractRYSK` class.

### 5.0.0
Removed `update()` method from the `AbstractRYSK` class. It is thus no longer necessary periodically call this method by the outside code.
