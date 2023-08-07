# RYSKUrl
This class is meant for downloading video files and SYK/RYSK data from the given URL, decoding them and providing
uvs, vertices and indices synced with the frame on the internally created HTML canvas (it utilizes ``@mantisvision/ryskbuffer`` 
to achieve that).

## Install
You can install this package using either of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskurl
npm install @mantisvision/ryskurl
```

## Usage:
In order to obtain the canvas with the current frame and synced data, a new object of this imported class needs to be created:
```javascript
const ryskObj = new RYSKUrl("video_url","data_url");
```
``data_url`` can point to data in one of these five formats:
* SYK1
* SYK2
* RYS0
* RYS1
* RYS2

They can be packed in a single .syk file or split into multiple .syk files. In the latter case, URL of the JSON manifest
(having .json extension) must be provided. "video_url" can also point either to the video file or to HLS manifest 
(having .m3u3 extension). For more details see the [HLS Support documentation](./hlssupport.md).

The process of decoding the data and pairing it with the video frames can be started by invoking ``init`` method on the object.
It returns a promise which resolves with the object containing HTML canvas element and HTML video element (the latter
mainly for the reference purposes or to be used in the edge situations when canvas element alone is insufficient).
It is very important to remember that the video is intentionally muted, so if it contains an audio track, the volume
needs to be turned up through ``setVolume()`` method:

```javascript
ryskObj.init()
	.then(elements => 
	{ 
		const { canvas, video } = elements;
		ryskObj.setVolume(1); // video is muted at the beginning to avoid autoplay issues on iOS Safari!
		/* do something with the canvas */ 
	}).catch(err => console.error(err));
```
The same canvas can be later (after invoking ``init``) obtained also by calling
```javascript
const canvas = ryskObj.getCanvas();
```
In order to ensure the canvas is updated according to the new frames in the video, ``update`` method has to be called
periodically on the object. One option is to put it into the ``requestAnimationFrame`` callback like this:
```javascript
const animate = () => 
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);
```

There is no need to call ``getCanvas`` after each update because it is the original HTML element which gets modified 
according to the new frames from the video and the current SYK/RYSK data.

In order to obtain the decoded frames, an event callback needs to be registered using ``on()`` method. The name of the
event is "dataDecoded" (it can also be found importing ``RyskEvents`` object from ``@mantisvision/utils`` package; namely
it's ``RyskEvents.dataDecoded``).

```javascript
ryskObj.on(RyskEvents.dataDecoded,async function(data)
{
	const { uvs, indices, vertices, frameNo } = data;
	await doSomething(uvs, indices, vertices, frameNo);
});
```
The passed callback should either be asynchronous or return a promise. Internally, RyskURL will wait till it resolves
in order to continue with matching the current video frame with the data.

The end of the video is marked by "video.ended" event (``RyskEvents`` object from ``@mantisvision/utils`` package has it
as ``RyskEvents.videoEnded``).
```javascript
ryskObj.on(RyskEvents.videoEnded,function()
{ /* free the resources, clean up */ });
```

At the end of the lifecycle, it is highly recommended to call ``dispose`` on the rysk object in order to free the system
resources.
```javascript
ryskObj.dispose();
ryskObj = null;
```
The usage may look like this:
```javascript
import { RYSKUrl } from "@mantisvision/ryskurl";
import { RyskEvents } from "@mantisvision/utils";

const ryskObj = new RYSKUrl("video_url","data_url");
var canvas = null;

const animate = () => 
{
	if (ryskObj !== null)
	{
		requestAnimationFrame(animate);
		ryskObj.update();
	}
};

ryskObj.on(RyskEvents.dataDecoded,async function(data)
{
	const { uvs, indices, vertices, frameNo } = data;
	await doSomething(uvs, indices, vertices, frameNo);
});

ryskObj.on(RyskEvents.videoEnded,() => 
{ 
	ryskObj.dispose();
	/* free the resources, clean up */ 
});

ryskObj.init().then(elements => 
	{
		requestAnimationFrame(animate);
		canvas = elements.canvas;
		/* do something with the canvas */
	}).catch(err => console.error(err));
```
## Issue of init(), play() and setPreviewMode()
The pre-buffering (which includes the downloading and decoding of the RYSK data) starts when ``init()`` method is executed. However, the video with the texture normally starts to play only after the ``play()`` method is called. It is only after that the promise from the ``init()`` method gets resolved. This mechanism was chosen so that user is actually forced to call ``play()`` manually due to autoplay issue in modern browsers (and predominantly on mobile devices).

However, you may wish to obtain some sort of "preview image" even before ``play()`` is executed. You can use method ``setPreviewMode(true)`` of the ``RYSKUrl`` object, ideally right after the object is constructed. When then the ``init()`` method is called, the library internally mutes the video (this is done to try to circumvent the autoplay ban), plays the video for one frame and then immediately pauses it and returns the volume to the previously set level.

The same thing also happens if ``jumpAt()`` method is called in case the video was paused prior to the jump. After the jump, the video is played for a single frame and then paused again which should result in drawing the first frame after the jump onto the canvas (this is, of course, unnecessary if the video is playing when it jumps).

There is no need to call ``setPreviewMode(true)`` each time you want to obtain the "preview image"; one call enables the behavior until it's turned off again by ``setPreviewMode(false)``.

# RYSKStream
This class works with a realtime, continuous MediaStream and it needs to be periodically fed by encoded SYK/RYSK data frames.
RYSKStream decodes delivered frames on its own in the separate worker process. Video is being played realtime, and 
the canvas is updated only if the SYK/RYSK data for the current frame has already been provided. Otherwise, the current
video frame is skipped and the process continues with the next one.

## Install
You can install this package using either of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskstream
npm install @mantisvision/ryskstream
```

## Usage:
To create a new instance of the class, a MediaStream object needs to be provided for the constructor:
```javascript
const ryskObj = new RYSKStream(MediaStream);
```
The process of decoding the data and pairing it with the video frames can be started by invoking ``init`` method on the object.
It returns a promise which resolves with the object containing HTML canvas element and HTML video element (the latter
mainly for the reference purposes or to be used in the edge situations when canvas element alone is insufficient).
It is very important to remember that the video is intentionally muted, so if it contains an audio track, the volume
needs to be turned up through ``setVolume()`` method:
```javascript
ryskObj.init()
	.then(elements => 
	{ 
		const { canvas, video } = elements;
		/* do something with the canvas */ 
	}).catch(err => console.error(err));
```
The same canvas can be later (after invoking ``init``) obtained also by calling
```javascript
const canvas = ryskObj.getCanvas();
```
In order to ensure the canvas is updated according to the new frames in the video, ``update`` method has to be called
periodically on the object. One option is to put it into the ``requestAnimationFrame`` callback like this:
```javascript
const animate = () => 
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);
```
Encoded SYK/RYSK data are passed using ``addRYSKData`` method. Only data describing a single frame might be used as an
argument. The programmer must ensure the passed data is in sync with the MediaStream. If it arrives only after 
the video frame it relates to, the canvas might not get redrawn with the proper frame since the RYSKStream tries to keep
up with the realtime video. The data should not be provided too early as well, least they exceed buffer capacity which 
is currently set to 100 frames.
```javascript
ryskObj.addRYSKData("version_of_RYSK_SYK",Uint8ArrayData);
```
In order to ensure the canvas is updated according to the new frames in the video, ``update`` method has to be called
periodically on the object. One option is to put it into the ``requestAnimationFrame`` callback like this:
```javascript
const animate = () => 
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);

```
There is no need to call ``getCanvas`` after each update because it is the original HTML element which gets modified 
according to the new frames from the video and the current SYK/RYSK data.

In order to obtain the decoded frames, an event callback needs to be registered using ``on()`` method. The name of the
event is "dataDecoded" (it can also be found importing ``RyskEvents`` object from ``@mantisvision/utils`` package; namely
it's ``RyskEvents.dataDecoded``).

```javascript
ryskObj.on(RyskEvents.dataDecoded,async function(data)
{
	const { uvs, indices, vertices, frameNo } = data;
	await doSomething(uvs, indices, vertices, frameNo);
});
```
The passed callback should either be asynchronous or return a promise. Internally, RYSKUrl will wait till it resolves
in order to continue with matching the current video frame with the data.

At the end of the lifecycle, it is highly recommended to call ``dispose`` on the rysk object in order to free the system
resources.
```javascript
ryskObj.dispose();
ryskObj = null;
```
The usage may look like this:
```javascript
import { RYSKStream } from "@mantisvision/ryskstream";
import { RyskEvents } from "@mantisvision/utils";

const ryskObj = new RYSKStream(media_stream);
var canvas = null;

const animate = () => 
{
	if (ryskObj !== null)
	{ // pass encoded data to RYSKStream
		ryskObj.addRYSKData("RYS0",data);
		requestAnimationFrame(animate);
		ryskObj.update();
	}
};

ryskObj.on(RyskEvents.dataDecoded,async function(data)
{
	const { uvs, indices, vertices, frameNo } = data;
	await doSomething(uvs, indices, vertices, frameNo);
});

ryskObj.init().then(elements => 
	{
		requestAnimationFrame(animate);
		canvas = elements.canvas;
		/* do something with the canvas */
	}).catch(err => console.error(err));

ryskObj.play(); //be aware that if you "await" till "run" resolves and only then call play(), you will block yourself.
```

# Events
Both RYSKUrl and RYSKMesh trigger multiple events during their lifecycle. A callback can be registered using ``on(event,func)``
 
 - buffering: either video or data is being buffered (it triggers on either bufferingData event or on "waiting" event of video element)
 - buffered: video and data are buffered, video can play (it triggers when "dataBuffered" event was triggered together with "playing" event of video element)
 - bufferingData: data are being buffered
 - dataBuffered: enough data has been buffered
 - dataDecoded: triggers each time data is decoded. The data is passed to the callback as its first parameter
 - decodingPaused: decoding of the data has paused because it's waiting till more data is downloaded
 - error: triggers on error
 - video.ended: triggers when the video finishes playing
 - disposed: triggers right after ``dispose()`` method on the object is called

It might become useful to listen also for native events of video element which can be registered through the
``onVideoEvent(event,func)`` callback which is in fact a mere wrapper around the native ``addEventListener`` method.

# Public API
## RYSKUrl
RYSKUrl provides the following methods:
```javascript
/**
 * Creates a new instance of the class, but doesn't start downloading the data yet.
 * @param {String} videourl url of the video to be downloaded
 * @param {String} dataurl url of the RYSK/SYK data
 * @param {Integer} frameBufferSize Size in frames of the buffer used to cached downloaded SYK/RYSK data
 */
constructor(videourl,dataurl,frameBufferSize = 50)
```
```javascript
/**
 * Sets video to loop or not to loop.
 * @param val true to loop, false no to loop
 */
set loop(val);
get loop();
```
```javascript
/**
 * Proxy getters for buffered and seekable properties of underlying video element.
 */
get buffered();
get seekable();
```
```javascript
/**
 * Sets the timestamp in which the video should start its playback. 
 * @param timestamp the end of the video
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
 * Inits the service and returns a promise which resolves with an object containing 2 properties: 
 * canvas (HTML canvas which gets updated with new frames) and video (HTML video element which serves as a "decoder" of video stream). It is important to remember that the video is initially muted, so you might want to call setVolume method afterwards.
 * @returns {Promise} promise which resolves after the video is ready to be played.
 */
async init();
```
```javascript
/**
 * Enable or disable the preview mode. If the preview mode is enabled, the library will try to obtain
 * the video frame and data as soon as init() method is run or as soon as jumpAt is finished.
 * @param {boolean} enable true for the preview mode enable and false to disable it
 * @returns this object for chaining
 */
setPreviewMode(enable);
```
```javascript
/**
 * Stops the video and audio. Essentially it calls pause method and then sets currentTime of the video to 0.
 * @returns {unresolved}
 */
async stop();
```
```javascript
/**
 * Jumps to a timestamp defined in seconds. In the background, this method sets currentTime of the video to a desired
 * value
 * @param {Integer} timestamp where to jump
 */
async jumpAt(timestamp);
```
```javascript
/**
 * Gets the duration of the video
 * @returns {Float} Duration of the video in seconds
 */
async getDuration()
```
## RYSKStream
RYSKStream provides the following methods:
```javascript
/**
 * Creates a new instance of the class, but doesn't start downloading the data yet.
 * @param {MediaStream} mediastream stream containing video (and maybe even audio)
 */
constructor(mediastream);
```
```javascript
/**
 * Inits the service and returns a promise which resolves with an object containing 2 properties: 
 * canvas (HTML canvas which gets updated with new frames) and video (HTML video element which serves as a "decoder" of video stream). It is important to realize the video is muted!
 * @param {Integer} videoWidth desired video width (if the real source given in the constructor is of different width, it will be resized)
 * @param {Integer} videoHeight desired video height (if the real source given in the constructor is of different height, it will be resized)
 * @returns {Promise} promise which resolves after the video is ready to be played.
 */
async init(videoWidth,videoHeight);
```
```javascript
/**
 * Adds one frame of RYSK data for decoding
 * @param {String} version version of the rysk data for decoding. Currently supported are: SYK0, SYK1, RYS0
 * @param {ArrayBuffer} data RYSK/SYK data itseld. First four bytes mark the frame number. This parameter must be ArrayBuffer, not just a TypeArray!
 * @returns {undefined}
 */
addRYSKData(version,data);
```
## Both RYSKUrl and RYSKStream
These two classes share some common methods:
```javascript
/**
 * Sets volume of the audio. This might not work as expected on some mobile devices, however, setting volume to 0 should
 * always mute the video. Remember to call it after you receive video element in from init() method, because the
 * element is muted by default.
 * @param {Float} volume number between 0 (muted) and 1 (full).
 */
setVolume(volume);
```
```javascript
/**
 * Gets canvas. Must be called after init() method!
 * @returns {HTML node|null} if the method is called before init() or after dispose(), it returns null.
 */
getCanvas();
```
```javascript
/**
 * To ensure the canvas is trully updated and a new frame from the video is processed, this method
 * must be called periodically (e.g. in requestAnimationFrame callback).
 * @returns {undefined}
 */
update();
```
```javascript
/**
 * Pauses download of the video and RYSK/SYK data, as well as audio. Therefore, the canvas will not change even if 
 * update is called. This method is asynchronous because internally it calls pause on HTML video element which returns 
 * a promise.
 * @returns {unresolved} the promise from HTML video elem pause call.
 */
async pause();
```
```javascript
/**
 * Plays the video and continues downloading RYSK/SYK data. This method is asynchronous because internally it calls play
 * on HTML video element which returns a promise.
 * @returns {unresolved} the promise from HTML video elem play call.
 */
async play();
```
```javascript
/**
 * Let the decoder know it can continue decoding
 * @param {Integer} frameCount how many frames should be decoded before the decoding is paused
 * @returns {undefined}
 */
continueDecoding(frameCount);
```
```javascript
/**
 * Checks whether the video is paused.
 * @returns {Boolean} true if it is, false otherwise.
 */
isPaused();
```
```javascript
/**
 * Checks whether the video in videoElement has stopped
 * @returns {Boolean} true if it has, false otherwise
 */
isEnded();
```
```javascript
/**
 * Registers a callback on an event type. Currently, the supported events are:
 * - buffering: either video or data is being buffered (it triggers on either bufferingData event or on "waiting" event of video element)
 * - buffered: video and data are buffered, video can play (it triggers when "dataBuffered" event was triggerd together with "playing" event of video element)
 * - bufferingData: data are being buffered
 * - dataBuffered: enough data has been buffered
 * - dataDecoded: triggers each time data is decoded. The data is passed to the callback as its first parameter
 * - decodingPaused: decoding of the data has paused because it's waiting till more data is downloaded
 * - error: triggers on error
 * - video.ended: triggers when video finishes playing
 * @param {string} event name
 * @param {callable} callback
 * @returns {undefined}
 */
on(event,callback);
```
```javascript
/**
 * Unregister a callback for an event type
 * @param {String} event event name
 * @param {callable} callback
 * @returns {undefined}
 */
off(event,callback);
```
```javascript
/**
 * Proxy to method addEventListener for internal videoElement object
 * @param {String|Array|Object} event if a string is given, then it represents name of the event, 
 *								if array, then to each event in this array, callback from the second parameter is attached,
 *								if it is and object, the attribute names should represent events and their values callbacks (in this case, callback parameter should be omitted)
 * @param {function} callback a callback to be attached to the given event(s)
 * @returns {AbstractRYSK} reference to this object for chaining
 */
onVideoEvent(event,callback = null);
```
```javascript
/**
 * Removes callbacks from event listeners attached to the video element
 * @param {String|Array|Object} event if a string is given, then it represents name of the event, 
 *								if array, then from each event in this array, the callback from the second parameter is detached,
 *								if it is and object the attribute names should represent events and their values callbacks (in this case, callback parameter should be omitted)
 * @param {function} callback a callback to be detached to the given event(s)
 * @returns {AbstractRYSK} reference to this object for chaining
 */
offVideoEvent(event,callback);
```
```javascript
/**
 * Proxy for the same method of the VideoElement. Allows to register callback on HLS events of hls.js. Beware that
 * on Safari the native HLS support is used instead of hls.js, so no callback will be emitted and an exception might
 * be thrown on an attempt to register the callback.
 * @param {String} event name of the event from hls.js
 * @param {callable} func callback which gets called on the event
 * @returns {RYSKUrl} this object for chaining
 */
onHlsEvent(event,func);
```
```javascript	
/**
 * Proxy for the same method of the VideoElement. Detaches the callback from the HLS event of hls.js. 
 * @param {String} event name of the event from hls.js
 * @param {callable} func callback which gets detached
 * @returns {RYSKUrl} this object for chaining
 */	
offHlsEvent(event,func);
```
```javascript	
/**
 * Same as onHlsEvent method, but the callback gets called only once.
 * @param {String} event name of the event from hls.js
 * @param {callable} func callback which gets called the next time the event is triggered
 * @returns {RYSKUrl} this object for chaining
 */
onceHlsEvent(event,func);
```
```javascript
/**
 * It is highly recommended to call this method after the work is finished in order to free the resources. It terminates
 * downloading of SYK/RYSK data.
 */
dispose();
```
## Release notes RYSKUrl

### 3.0.0
- Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.
- *BREAKING CHANGE*: Method ``RYSKUrl.run`` was renamed to ``RYSKUrl.init`` to avoid the conflict with the same named method from ``@mantisvision/ryskthreejs`` and other libraries which provide classes that inherit from the ``RYSKUrl`` class.

#### 3.0.1
- *POTENTIAL BREAKING CHANGE* buffered event of RYSKUrl is fired not when the underlying HTMLVideo element triggers "playing" event, but when it triggers "canplay". This is because the "playing" event gets triggered every time a user plays a paused video, even if no buffering 
ocurred prior to that.

#### 3.0.2
- When ``RYSKUrl.pause`` method is called, the download of RYSK data isn't stopped as before. This is to prevent the situation when the first
buffering hasn't ocurred yet and the video gets stopped which actually prevents the first buffering from finishing.

### 3.1.0
- Added a new method ``setPreviewMode(mode: boolean)`` that can be called to enable a "preview mode" in which the video is played automatically for a single frame in ``init()`` method in order to provide at least one frame to the ``RYSKBuffer`` and to the derived classes. This provide an ability to show a preview of the video even before a user hits a play button. The same functionality applies also to ``jumpAt()`` method.

#### 3.1.1
- Fixed the bug when ``setPreviewMode(true)`` didn't behave as intended when the ``stop()`` method was called.

#### 3.1.2
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

### 3.2.0
- for the buffering purposes, the library now listens for ``canplaythrough`` event instead of ``canplay`` event of the video
- ``jumpAt()`` method now resolves only after the ``seeked`` event is fired by the underlying video element

### 3.3.0
Allows to set beginning and end timestamps of the video in order to trim it into a shorter duration (this is actually related to [@mantisvision/utils v2.3.0](./utils.md#230))

## Release notes RYSKStream

### 4.0.0
- Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.
- *BREAKING CHANGE*: Method ``RYSKStream.run`` was renamed to ``RYSKStream.init`` to avoid the conflict with the same named method from ``@mantisvision/ryskthreejs`` and other libraries which provide classes that inherit from the ``RYSKStream`` class.

#### 4.0.4
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

#### 4.0.7
Upgrade due to version [0.6.0](./buffer.md#060) of ``@mantisvision/ryskbuffer`` 
