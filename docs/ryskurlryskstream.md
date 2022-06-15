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
``data_url`` can point to data in one of these three formats:
* SYK1
* SYK2
* RYSK

The process of decoding the data and pairing it with the video frames can be started by invoking ``run`` method on the object.
It returns a promise which resolves with the object containing HTML canvas element and HTML video element (the latter
mainly for the reference purposes or to be used in the edge situations when canvas element alone is insufficient):
```javascript
ryskObj.run()
	.then(elements => 
	{ 
		const { canvas, video } = elements;
		/* do something with the canvas */ 
	}).catch(err => console.error(err));
```
The same canvas can be later (after invoking ``run``) obtained also by calling
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

The end of the video is marked by "video.ended" event (`RyskEvents`` object from ``@mantisvision/utils`` package has it
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

ryskObj.run().then(elements => 
	{
		requestAnimationFrame(animate);
		canvas = elements.canvas;
		/* do something with the canvas */
	}).catch(err => console.error(err));
```
# RYSKStream
This class works with a realtime continues MediaStream and it needs to be periodically fed by encoded SYK/RYSK data frames.
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
The process of decoding the data and pairing it with the video frames can be started by invoking ``run`` method on the object.
It returns a promise which resolves with the object containing HTML canvas element and HTML video element (the latter
mainly for the reference purposes or to be used in the edge situations when canvas element alone is insufficient):
```javascript
ryskObj.run()
	.then(elements => 
	{ 
		const { canvas, video } = elements;
		/* do something with the canvas */ 
	}).catch(err => console.error(err));
```
The same canvas can be later (after invoking ``run``) obtained also by calling
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
The passed callback should either be asynchronous or return a promise. Internally, RyskURL will wait till it resolves
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

ryskObj.run().then(elements => 
	{
		requestAnimationFrame(animate);
		canvas = elements.canvas;
		/* do something with the canvas */
	}).catch(err => console.error(err));
```

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
constructor(videourl,dataurl,frameBufferSize = 100)
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
 * Runs the service and returns a promise which resolves with an object containing 2 properties: 
 * canvas (HTML canvas which gets updated with new frames) and video (HTML video element which serves as a "decoder" of video stream).
 * @returns {Promise} promise which resolves after the video is ready to be played.
 */
async run();
```
```javascript
/**
 * Stops the video and audio. Essentially it calls pause method and then sets currentTime of the video to 0.
 * @returns {unresolved}
 */
async stop();
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
 * Runs the service and returns a promise which resolves with an object containing 2 properties: 
 * canvas (HTML canvas which gets updated with new frames) and video (HTML video element which serves as a "decoder" of video stream).
 * @param {Integer} videoWidth desired video width (if the real source given in the constructor is of different width, it will be resized)
 * @param {Integer} videoHeight desired video height (if the real source given in the constructor is of different height, it will be resized)
 * @returns {Promise} promise which resolves after the video is ready to be played.
 */
async run(videoWidth,videoHeight);
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
 * always mute the video.
 * @param {Float} volume number between 0 (muted) and 1 (full).
 */
setVolume(volume);
```
```javascript
/**
 * Gets canvas. Must be called after run() method!
 * @returns {HTML node|null} if the method is called before run() or after dispose(), it returns null.
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
 * Registers a callback on an event type. Currently, the only supported events are dataDecoded, decodingPaused, error and video.ended
 * @param {string} event name of the event type (either error, dataDecoded, decodingPaused, video.ended)
 * @param {callable} callback
 * @returns {undefined}
 */
on(event,callback);
```
```javascript
/**
 * Unregister a callback for an event type
 * @param {String} event event name of the event type (either error, dataDecoded, decodingPaused, video.ended)
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
 *								if it is and object the attribute names should represent events and their values callbacks (in this case, callback parameter should be omitted)
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
 * It is highly recommended to call this method after the work is finished in order to free the resources. It terminates
 * downloading of SYK/RYSK data.
 */
dispose();
```
