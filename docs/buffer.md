# RYSKBuffer
This package buffers encoded data and tries to match it with the current frame of the video.
Data should be submitted continuesly and preferably in sync (or ahead) of video frames, otherwise some parts of the video 
are skipped (in case of the "live" video streaming) or the video is paused till the proper data isn't delivered (in case
of the pre-recorded video).

The other important function of buffer is to grab frames from the given video element, print them on the internally
created HTML canvas and pair them with the buffered data. Canvas with the current frame can be obtained through
``getCanvas`` method. In fact, it is always the same HTML canvas object which gets redrawn with the current
frame, so there is no need to call this method more than once. The data that match the frame on the canvas is delivered
through tha callback passed to the constructor. This callback can be asynchronous (or return a promise) and RYSKBuffer
will wait until it resolves before drawing another frame on the canvas.

It is advisable to periodically call ```update``` method of RYSKBuffer object in window.requestAnimationFrame callback 
or in a similar way so that the RYSKBuffer knows to check for a new video frame.

Once the last SYK/RYSK frame has been decoded, the method ```allDataDecoded``` should be called. This is because RYSKBuffer
by default pauses the video play if a sufficient amount of data isn't preloaded. The amount equals to one third of
the size of the buffer. Especially if the video suddenly jumps to a timestamp near its very end, there might not be enough
frames to sufficiently fill the buffer in order for it to resume playing the video. 

Once the end of the video is reached and the total amount of the decoded frames is known, you might want to rescale the
buffer size up or down by calling the ```modifyBuffer``` method.

If the video jumps to a different timestamp, you might want to see if the next frame number can be paired with an aleready
decoded data. This can be done by registering a callbac using the method ```reportIfMissingDataForNextFrame```. 
It will be triggered if the very next frame number extracted from the frame by RYSKBuffer doesn't have a coresponding
volumetric data yet. The number of the frame is returned as the parameter of the callback.  However, the callback won't
be triggered at all if there already is a data to pair to the next frame

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskbuffer
npm install @mantisvision/ryskbuffer
```

## Usage:
You can use RYSKBuffer for example like this:
```javascript
import { RYSKBuffer } from "@mantisvision/ryskbuffer";

var canvas = null;

/**
 * Buffer some data in the buffer till the appropriete frame comes in the video
 */
async function bufferEncodedData(ryskBuffer)
{
	var counter = 0;
	while (true)
	{// somehow get decoded data for a frame using @mantisvision/downloader or directly @mantisvision/decoder
		const decodedData = await getDecodedFrameData(); 
		if (decodedData !== null)
		{
			counter++;
			ryskBuffer.addData(frameNo,vertices,uvs,indices); //pass the data to RyskBuffer
		}else break;
	}
	
	ryskBuffer.allDataDecoded();
	ryskBuffer.modifyBuffer(counter / 3); //rescale the buffer size to one third of the total amount of decoded frames
}

/**
 * Receive data synced with the current frame. Notice this function is asynchronous (or it may also return a promise).
 * That is because internally, RYSKBuffer waits with matching a frame of the video against decoded data until this
 * callback resolves.
 */
async function receiveSyncedData(data)
{
	if (canvas !== null)
	{
		const { frameNo, uvs, indices, vertices } = data;
		// in this moment, canvas contains the video frame which corresponds with frameNo, uvs, indices, vertices
		// RYSKBuffer's method which calls this callback will wait till it resolves and only then updates canvas element
		// with the new frame. This should ensure, that until the final mesh is drawn, the frame won't change.
		await drawTheDataWithTheFrame(canvas, frameNo, uvs, indices, vertices);
	}
}

const ryskBuffer = new RYSKBuffer(receiveSyncedData,videoElem);
canvas = ryskBuffer.getCanvas();

const animate = () => 
{
	requestAnimationFrame(animate);
	ryskBuffer.update();
};
requestAnimationFrame(animate);

// buffer the data in the cycle till they come
bufferEncodedData(ryskBuffer).then(() => ryskBuffer.dispose());
```
Aside from RYSKBuffer, the package also exports Helper object which is used by the package when it needs to create a canvas
element. By default, it does it through
```javascript
document.createElement("canvas");
```
However, you might want to provide your own method in case your application has no access to the global document object.
You can do this like this:
```javascript
import { Helper } from "@mantisvision/ryskbuffer";

Helper.setGenerateCanvas(function()
{//your own code to generate the canvas element
	const newCanvas = myOwnMethod();
	return newCanvas;
});
```

## Public API

### RYSKBuffer
```javascript
/**
 * Creates a new instance of RYSKBuffer which serves to canvas from the given video and buffers the data which
 * the object needs to be fed with periodically. It then sync the data with the current frame and provides the relevant
 * data through the callback which is passed as the first argument.
 * @param {callable} onDataCallback this function is called once the data for the current frame is availible. Indices, vertices, uvs and frameNo are passed as an object in the parameter. The function should return a promise (or be asynchroneous) which resolves once the next frame is supposed to be processed
 * @param {DOMElement} srcVideoElem source video element
 * @param {Boolean} realtime indicates whether video is considered realtime (i.e. a constant stream). RYSKBuffer then knows it shouldn't pause such a video whilest waiting for a proper RYSK data.
 * @param {Integer} videoWidth you can specify width of the video. If set to null (default), widh will be read from the srcVideoElem. If you set this parameter, the srcVideoElem will be stretched (or shrunk) to accomodate the desired size.
 * @param {Integer} videoHeight see the previous parameter
 * @param {Integer} frameBufferSize set the size of the framebuffer for the data describing the frames (i.e. uvs, indices, vertices). This parameter has but a limited usage if the "realtime" video is used, since the video can't be realistically paused to wait for the enough data
 */
constructor(onDataCallback,srcVideoElem,realtime = false,videoWidth = null, videoHeight = null, frameBufferSize = 100);
```
```javascript
/**
 * Modify the size of the buffer (the real buffer might end up being bigger in order to avoid deleting already buffered data
 * This function should be used very carefully, since the buffer is actually cyclic and this can potentially destroy data.
 * @param {Integer} newSize new size of the buffer. If there is already more data buffered, the new buffer size might end up being bigger!
 * @returns {Integer} the actual new size of the buffer (might be bigger than the requested size!)
 */
modifyBuffer(newSize);
```
```javascript
/**
 * Reset the whole data buffer. It is used in the contstructor, and if the user changes current timestamp of the video
 * (e.g. using seek or hitting stop button and returning video to the beginning), this method shoud be called as well.
 */
resetBuffer();
```
```javascript
/**
 * Registers a callback which is called just once (!) when the data buffer is filled less than from one third.
 * This could be used to once again resume the download of the data if it was paused before (e.g. due to too many
 * data downloaded ahead).
 * @param {callable} callback function to call as a callback. Two parameters will be passed: an Integer which equals 
 *                   to one third of data buffer length (e.g. length is 60, param will be 20) and an Integer indication 
 *                   number of the last frame in the buffer + 1 or the number of the frame the buffer is currently waiting for.
 */
onceSmallerDiff(callback);
```
```javascript
/**
 * Returns canvas from the header decoder. The canvas gets automatically redrawn with the new image from videoElement.
 * @returns {HTMLNode} HTML canvas element
 */
getCanvas();
```
```javascript
/**
 * Add geometry data to the buffer
 * @param {Integer} frameNo frame number for which the data should be delivered
 * @param {Float32Array} vertices 
 * @param {Float32Array} uvs
 * @param {Uint8Array | Uint16Array | Uint32Array} indices
 */
addData(frameNo,vertices,uvs,indices);
```
```javascript
/**
 * This method should be called for the buffer to check whether there is a new frame in the video.
 * Ordinary it might be called in "window.requestAnimationFrame" callback.
 */
update();
```
```javascript
/**
 * Resumes playing of the given video.
 * @returns {undefined}
 */
videoPlaying();
```
```javascript
/**
 * Pauses the current video
 * @returns {undefined}
 */
videoPaused();
```
```javascript
/**
 * Returns the current frame number which is being processed.
 * @returns {Number|integer}
 */
getCurrentVideoFrame();
```
```javascript
/**
 * Get the current size of the frame buffer.
 * @returns {Integer} size of the buffer in videoframes (e.g. 30 means max 30 video frames will be buffered)
 */
getCurrentSize();
```
```javascript
/**
 * Registers a one-time callback which gets trigger the next time header from video gets decoded and isn't immediately
 * paired with a buffered frame. 
 * @param {callable} callback to be called
 */
reportIfMissingDataForNextFrame(callback);
```
```javascript
/**
 * This method must be called once all the RYSK volumetric data was downloaded and decoded and no more is currently planned
 * to be (e.g. the video isn't "on loop"). The method automatically executes onceSmallerDiff callback and internal
 * waitingFrame callbacks. These would be normally triggered only after a sufficient number of data was downloaded
 * ahead, but this might actually never happen, since there might be no more SYK/RYSK data to decode
 */
allDataDecoded();
```
```javascript
/**
 * Defacto a destructor. This method should be called after the object is no longer needed in order to clean after
 * itself.
 * @returns {undefined}
 */
dispose();
```

### Helper
```javascript
/**
 * This method serves for generating the canvas element. If document object is unavailible (e.g. in node.js), it should
 * be replaced with an appropriate substitute which will return canvas. The replacement method can be set using
 * Helper.setGenerateCanvas(replacement).
 * @returns {Element} Canvas element
 */
generateCanvas: function();
```
```javascript
/**
 * Set custom function for generating the canvas.
 * @param {callable} customMethod your custom function which returns canvas element.
 */
setGenerateCanvas: function(customMethod);
```

## Release notes

### 0.5.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

### 0.5.2
Added searching for the frame in the whole buffer even if it's not fully filled.
