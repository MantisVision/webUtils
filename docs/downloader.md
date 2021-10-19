# RYSKDownloader
This package contains a downloader class which is used for downloading data from the given url, splitting them into frames
and passing those frames to @mantisvision/decoder. Internally it uses standard javascript Streams API together with standard fetch function.
Downloaded data is being continuesly split to individual frames and then passed to @mantisvision/decoder.
Each decoded frame data consists of UVs, vertices and indices and is identified by the associated frame number.
(see @mantisvision/decoder documentation)

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskdownloader
npm install @mantisvision/ryskdownloader
```

## Usage:
You can use RYSKDownloader like this:
```javascript
import RYSKDownloader from "@mantisvision/ryskdownloader";

const downloader = new RYSKDownloader("https://example.com/data.bin");
downloader.on("frame-downloaded",event => 
{
	const { frameNo, vertices, uvs, indices } = event.data;
	//vertices, uvs and indices are TypedArrays which share the same ArrayBuffer.
});
downloader.start(100);
```

## Format of RYSK data
Data for all frames are packed in a single file. First 3 bytes of the file specify the type of data in ASCII encoding.
Currently, the type is either SYK or RYS.

The fourth byte of file is numeric representation of version. Thus in theory, the version can range from 0 to 255. Currently,
only versions 0 or 1 for SYK and 0 for RYS are supported.

Combing these two information together, we get three possible values for data format:
* SYK0
* SYK1
* RYS0
When an instance of [RYSKDecoder](./decoder.md) is created, its constructor accepts single arguement which is this specific data
format as a string.

Following the data format are individual frames. Each frame begins with a its size encoded on 4 bytes as an unsinged 32-bit integer
in little endian. Size indicates how many following bytes belong to the frame. 

Next 4 bytes specify frame number in an unsinged 32-bit integer in little endian. The size mentioned above includes these
four bytes.

The rest is encoded data which needs to be passed to [RYSKDecoder](./decoder.md) which returns decoded uvs, vertices
and indices (see its API).

## Public API
```javascript
/**
 * Creates a new downloader object which will later, after calling connect method, connects to a given url, 
 * downloads frames and decrypts them.
 * @param {String} url url from which to download the RYSK data
 */
constructor(url);
```
```javascript
/**
 * Registers a callback on an event.
 * @param {String} event name of the event. Supported events are:
 *			frame-downloaded: called after the entire frame finishes downloading
 *			error: called on error
 *			decoding-paused: called in a case the decoding has paused (e.g. enough frames ahead has been decoded)
 *			downloading-finished: the entire file from the given URL has been downloaded
 *			downloading-started: downlaoding has just started
 * @param {callable} callback function to call on a specified event
 */
on(event,callback);
```
```javascript
/**
 * Unregister specific callback for an item
 * @param {String} event name of the event
 * @param {callable} callback function to unregister
 */
off(event,callback);
```
```javascript
/**
 * Starts downloading and decoding.
 * @param {Integer} frameCount how many frames should be decoded. This is used so you don't unnecessary decode too many frames ahead.
 */
start(frameCount);
```
```javascript
/**
 * Pause downloading
 */
pause();
```
```javascript
/**
 * Resume paused downloading
 * @param {Integer} frameCount how many frames should be decoded after the downloading resumes
 */
resume(frameCount);
```
```javascript
/**
 * Completely stops the download process.
 */
cancel();
```
```javascript
/**
 * Checks if the downloader is still downloading
 * @returns {Boolean} true if it is, otherwise false
 */
isDownloading();
```
```javascript
/**
 * Checks if the downloader has started
 * @returns {Boolean} true if it did, otherwise false
 */
isStarted();
```
```javascript
/**
 * Checks if the downloader has successfully finished
 * @returns {Boolean} true if it did, otherwise false
 */
isFinished();
```
