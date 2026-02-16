# RYSKBuffer
This package buffers encoded data and tries to match it with the current progress of the media (either a video frame or an audio timestamp).
Data should be submitted continuously and preferably in sync (or ahead) of media progress, otherwise some parts of the media 
are skipped (in case of the "live" streaming) or the media is paused till the proper data isn't delivered (in case of the pre-recorded playback).

In case of the SYK, RYSK and SPACK data the buffer also handles grabbing frames from the given video element, print them on the internally
created HTML canvas and pair them with the buffered data. Canvas with the current frame can be obtained through
`getCanvas` method. In fact, it is always the same HTML canvas object which gets redrawn with the current
frame, so there is no need to call this method more than once. The data that match the frame on the canvas is delivered
through the callback passed to the constructor. This callback can be asynchronous (or return a promise) and `RYSKBuffer`.
will wait until it resolves before drawing another frame on the canvas.

Once the last SYK/RYSK frame has been decoded, the method `allDataDecoded()` should be called. This is because `RYSKBuffer`
by default pauses the playback if a sufficient amount of data isn't preloaded. The amount equals to one third of
the size of the buffer. Especially if the video suddenly jumps to a timestamp near its very end, there might not be enough
frames to sufficiently fill the buffer in order for it to resume playing the video. 

Once the end of the video is reached and the total amount of the decoded frames is known, you might want to rescale the
buffer size up or down by calling the `modifyBuffer` method. This is done by default in the class `AbstractRYSK` from `@mantisvion/utils`.

If the video jumps to a different timestamp, you might want to see if the next frame number can be paired with an already
decoded data. This can be done by registering a callback using the method `reportIfMissingDataForNextFrame`. 
It will be triggered only once if the very next frame number extracted by the `RYSKBuffer` doesn't have a corresponding
volumetric data yet. The number of the frame is returned as the parameter of the callback.  However, the callback won't
be triggered at all if there already is a data to pair with the next frame.

Important callback to register is also `onceSmallerDiff` which gets called the next time the buffer doesn't contain a safe amount
of pre-buffered data (1/3 of the buffer or even less). The registered callback is passed the number of data that should be read
ahead as the first parameter and optionally also the frame the library is waiting for if the buffer is completely empty and there
is a video frame/audio timestamp which needs to be paired with the data.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/ryskbuffer
npm install @mantisvision/ryskbuffer
```

## Usage:
Currently there are three different buffers exported from `@mantisvision/ryskbuffer`. The main `RYSKBuffer` serves to buffer RYSK/SYK
data for both, the pre-recorded playback and also for the live real-time streaming. `SPACKBuffer` and `SPLINTERBuffer` can be right now used
only for the pre-recoded playback.
You can use RYSKBuffer for example like this:
```javascript
import { RYSKBuffer } from "@mantisvision/ryskbuffer";

var canvas = null;

/**
 * Buffer some data in the buffer till the appropriate frame comes in the video
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
			ryskBuffer.addData(decodedData); //pass the data to RyskBuffer
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

const ryskBuffer = new RYSKBuffer(receiveSyncedData, videoElem);
canvas = ryskBuffer.getCanvas();
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
All three classes - `RYSKBuffer`, `SPACKBuffer` and `SPLINTERBuffer` - implement the same generic interface `iDataBuffer<DataType>` from `@mantisvision/utils`. It defines the following API:

```typescript
interface iDataBuffer<DataType extends { frameNo: number }> 
{
	/**
	 * Gets the current max size of the buffer
	 * @returns current max size of the buffer in the number of stored decoded data frames
	 */
	getFrameBufferSize(): number;

	/**
	 * Returns the number of the frame the buffer is currently waiting for or -1 if it doesn't wait for any.
	 */
	getWaitingFrameNumber(): number;

	/**
	 * Number of the current frame
	 * @returns number of the current frame
	 */
	getCurrentFrameNo(): number;

	/**
	 * Get the current size of the frame buffer.
	 * @returns {number} size of the buffer in videoframes (e.g. 30 means max 30 video frames will be buffered)
	 */
	getCurrentSize(): number;

	/**
	 * Reset the whole data buffer. It is used in the contstructor, and if the user changes current timestamp of the video
	 * (e.g. using seek or hitting stop button and returning video to the beginning), this method shoud be called as well.
	 */
	resetBuffer(): void;
	
	/**
	 * Registers a one-time callback which gets trigger the next time header from video gets decoded and isn't immediately
	 * paired with a buffered frame.
	 * @param {callable} callback to be called
	 */
	reportIfMissingDataForNextFrame(callback: (frameNo: number) => void): void;
	
	/**
	 * Modify the size of the buffer (the real buffer might end up being bigger in order to avoid deleting already buffered data
	 * This function should be used very carefully, since the buffer is actually cyclic and this can potentially destroy data.
	 * @param {number} newSize new size of the buffer. If there is already more data buffered, the new buffer size might end up being bigger!
	 * @returns {number} the actual new size of the buffer (might be bigger than the requested size!)
	 */
	modifyBuffer(newSize: number): number;

	/**
	 * Registers a callback which is called just once (!) when the data buffer is filled less than from one third.
	 * This could be used to once again resume the download of the data if it was paused before (e.g. due to too many
	 * data downloaded ahead).
	 * @param {callable} callback function to call as a callback. Its only parameter is an Integer which equals to one third of data buffer length (e.g. length is 60, param will be 20).
	 */
	onceSmallerDiff(callback: (frameCount: number, frameToResume: number|null) => void): void;
	
	/**
	 * Register callback on an event.
	 * @param {keyof EventCallbacks} event either bufferingData (video gets paused due to lack of decoded data in the buffer) or dataBuffered (video can resume as there is enough data in the buffer)
	 * @param {callable} callback
	 * @returns {RYSKBuffer} reference to this object for chaning
	 */
	on<EventType extends string = string>(event: EventType, callback: EventType extends "initialBuffering" ? () => void : (frameNo: number) => void): void;
	
	/**
	 * Unregister callback from an event
	 * @param {keyof EventCallbacks} event either bufferingData or dataBuffered
	 * @param {callable} callback unregistered callback
	 * @returns {RYSKBuffer}
	 */
	off<EventType extends string = string>(event: EventType, callback: EventType extends "initialBuffering" ? () => void : (frameNo: number) => void): void;

	/**
	 * This method must be called once all the RYSK volumetric data was downloaded and decoded and no more is currently planned
	 * to be (e.g. the video isn't "on loop"). The method automatically executes onceSmallerDiff callback and internal
	 * waitingFrame callbacks. These would be normally triggered only after a sufficient number of data was downloaded
	 * ahead, but this might actually never happen, since there might be no more SYK/RYSK data to decode
	 */
	allDataDecoded(): void;

	/**
	 * Save the number of the last frame currently in the buffer as the last ever decoded frame number.
	 */
	markLastFrame(): void;

	/**
	 * Add geometry data to the buffer
	 * @param {data} data to buffer which contain also the frame number
	 */
	addData(data: DataType): void;

	/**
	 * Returns how many frames ahead should be pre-decoded (usually one third of the buffer size).
	 */
	getAheadReadCount(): number;

	/**
	 * Resets the current video frame to -1. This method should be called when a jump to a different timestamp
	 * occurs in order to prevent check for frame number difference.
	 */
	resetCurrentFrameNo(): void;
	
	/**
	 * Get data from buffer for specific frame number. If the frameNo is not in the buffer then undefined is returned;
	 * @param frameNo
	 * @returns located dataframe or undefined if no corresponding data frame could be found
	 */
	getDataFrame(frameNo: number): Promise<DataType | undefined>;

	/**
	 * Defacto a destructor. This method should be called after the object is no longer needed in order to clean after
	 * itself.
	 */
	dispose(): void;
}
```

### RYSKBuffer and SPACKBuffer
Besides the methods from the implemented interface, both these classes add the following constructor and public methods:
```typescript
/**
 * Creates a new instance of RYSKBuffer which serves to canvas from the given video and buffers the data which
 * the object needs to be fed with periodically. It then sync the data with the current frame and provides the relevant
 * data through the callback which is passed as the first argument.
 * @param {callable} onDataCallback this function is called once the data for the current frame is availible. Indices, vertices, uvs and frameNo are passed as an object in the parameter. The function should return a promise (or be asynchroneous) which resolves once the next frame is supposed to be processed
 * @param {DOMElement} srcVideoElem source video element
 * @param {Boolean} realtime indicates whether video is considered realtime (i.e. a constant stream). RYSKBuffer then knows it shouldn't pause such a video whilest waiting for a proper RYSK data.
 * @param {Integer} videoWidth you can specify width of the video. If set to null (default), widh will be read from the srcVideoElem. If you set this parameter, the srcVideoElem will be stretched (or shrunk) to accomodate the desired size.
 * @param {Integer} videoHeight see the previous parameter
 * @param {Integer} frameBufferSize set the size of the framebuffer for the data describing the frames (i.e. uvs, indices, vertices)
 */
constructor(
	onDataCallback: (data: DataType) => void, 
	srcVideoElem: VideoElement,
	realtime: boolean = false,
	videoWidth: number|null = null, 
	videoHeight: number|null = null, 
	frameBufferSize: number = 50
);	
```
```typescript
/**
 * Returns canvas from the header decoder. The canvas gets redrawn each frame with the new image.
 */
async getCanvas(): Promise<HTMLCanvasElement | null>;
```

### SPLINTERBuffer
SPLINTER buffer uses an `AudioElement` from `@mantisvision/utils` for synchronization of the decoded frame data with the timestamp. Besides the methods from the implemented interface, it adds the following constructors and public methods:
```typescript
/**
 * Creates a new instance of SPLINTERBuffer which serves to canvas from the given video and buffers the data which
 * the object needs to be fed with periodically. It then sync the data with the current frame and provides the relevant
 * data through the callback which is passed as the first argument.
 * @param {callable} onDataCallback this function is called once the data for the current frame is availible. Indices, vertices, uvs and frameNo are passed as an object in the parameter. The function should return a promise (or be asynchroneous) which resolves once the next frame is supposed to be processed
 * @param {DOMElement} srcAudioElem source audio element
 * @param {Boolean} realtime indicates whether the playback is considered realtime (i.e. a constant stream). Buffer then knows it shouldn't pause such a media whilest waiting for a proper data.
 * @param {Integer} frameBufferSize set the size of the framebuffer for the data describing the frames (i.e. uvs, indices, vertices)
 * @param {Integer} fps framerate of the playback. Default value is 30
 */
constructor(
	onDataCallback: (data: DataType) => void, 
	srcAudioElem: AudioElement, 
	realtime: false = false, 
	frameBufferSize: number = 50, 
	fps: number = 30
);
```
```typescript
/**
 * Returns canvas from the header decoder. The canvas gets redrawn each frame with the new image.
 */
async getCanvas(): Promise<HTMLCanvasElement | null>;
```

### Helper
```javascript
/**
 * This method serves for generating the canvas element. If document object is unavailable (e.g. in node.js), it should
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

#### 0.5.2
Added searching for the frame in the whole buffer even if it's not fully filled.

#### 0.5.3
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

#### 0.5.5
Main loop which decodes frame numbers from the video header now doesn't stop when the video is paused (with the exception of Firefox due to missing "requestVideoFrameCallback"). This changes means that even after the jump, at least one new frame is read.

### 0.6.0
Added ``getWaitingFrameNumber()`` and ``getAheadReadCount()`` methods.

#### 0.6.1
Added ``resetCurrentVideoFrame()`` method which should be called each time video jumps to a different timestamp in order to prevent skipping of frames in case of HLS videos (the skipping is normally done as a prevention from a sudden resolution changes).

#### 0.6.2
- ``getWaitingFrameNumber()`` method returns -1 as soon as the frame was given even if the buffer still waits for additional data frames to buffer (in that case, the frame position in ``waitingFrame`` internal structure is already filled, but the structure itself hasn't been emptied yet)
- Attempt to fix a bug in ``private_getDiff`` method, so that it now correctly returns 0 if the last inserted frame is also the current frame (instead of the full length of the buffer as before).

#### 0.6.4
Trying to more effectively free the memory when the Header decoder is destroyed.

#### 0.6.5
Trying to solve the issue when the preview mode was set, therefore the first frame might have read from the video before initial buffering was
finished which might have resulted in a deadlock because the "first buffering finished" event wasn't triggered.

#### 0.6.6
Method ``resetCurrentVideoFrame`` now also resets ``waitingFrame`` structure if it is filled and if the header decoder is waiting for a frame, its resolve from the said structure is also called with -1 in order to prevent the decoder getting stuck with waiting for a data which won't come.

#### 0.6.7
When a new a frame is sent to buffer via ``addData`` method, it is first checked whether the buffer is not waiting for a different frame and if it is, the sent frame is considered no longer valid. This situation happened if the pause/reset/jumpTo was sent to ``@mantisvision/ryskdownloader``, but before receiving it, the downloader still managed to sent some decoded frames.

### 0.7.0
Added ability to buffer SPACK/SPLINTER data.

### 0.8.0
Code reorganized, so the package exports three different buffers: `RYSKBuffer` for storing RYSK/SYK data, `SPACKBuffer` for SPACK data and `SPLINTERBuffer` for SPLINTER data.

### 0.9.0
Removed `update()` method from the buffers. It is thus no longer necessary to periodically call this method in order read a new frame or a timestamp from the media or check if the buffer is nearly empty. All of this is now done automatically by the buffers.