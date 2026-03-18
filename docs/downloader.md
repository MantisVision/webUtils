# RYSKDownloader
This package contains a downloader class which is used for downloading SYK/RYSK/SPACK/SPLINTER data from the given url, splitting it into frames
and passing those frames to ``@mantisvision/decoder``. Internally it uses standard javascript Streams API together with standard fetch function.
The downloader also implements a buffering mechanism which is described in the following chapter.

## Buffering
The downloader buffers raw, uncompressed volumetric data in order to maximize chance for an uninterrupted playback. The data is buffered either into the [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) or [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) based on the availability of OPFS synchronous methods. The buffered data persist between the sessions, so the subsequent replay of the same volumetric video (or the next loop) downloads only the missing data chunks. The data files are considered the same if they're downloaded from the same URL (minus the querystring) and have the same bytesize.

Before the playback starts, the library always pre-buffers the requested amount of data and then tries to guess the download speed. Based on the result decides whether it should continue the buffering till it has enough data for the uninterrupted playback.

## SYK/RYSK data file
SYK/RYSK data can be stored either in a single .syk file or they can be split into multiple .syk files, each containing
only the data for certain frames. In the latter case, a manifest must be provided in a form of JSON which primarily describes which
file contains which frames. The JSON format is as follows:
```json
[{
  "quality": integer,
  "version": string,
  "baseUrl": string,
  "data": [[integer,string],[integer,string],...]
},...]
```
The root element is an array because SYK/RYSK data can be in multiple qualities (similar to HLS or MPEG-DASH with video
files). Each element of the array is an object describing a "single quality".

``quality`` property of the object is its quality's
numeric representation with lower numbers being inferior quality to higher numbers. In the current version, however, other
elements of the root array are currently not considered when downloading the data since HLS support for RYSK data hasn't
been implemented yet.

``version`` property describes the version of SYK/RYSK data format; currently either SYK0, SYK1, RYS0 or RYS1.

``baseUrl`` points towards part of the path which all .syk files share. If it's a relative URL, than it's relative to
the URL of the manifest file,

``data`` field is an array containing tuples; a two element arrays of which the first element is the number of the first frame
in a single split SYK/RYSK data file. The second element contains the path to that single split file. The path is
relative to the baseUrl property. Bear in mind that the first RYSK data in each split SYK/RYSK data file must be a keyframe,
otherwise the decoding fails. The split files also shouldn't contain 4 byte identification of the file's format version (e.g.
RYS0, SYK0 etc) since that one is already specified by the ``version`` property.

The only current advantage of having SYK/RYSK data in multiple files is a faster jumping to a specific timestamp, as
the RYSKDownloader doesn't need to download one big file to reach the desired frame, but only a portion of a smaller one.
However, even this advantage is questionable as a majority of modern HTTP servers support "range" header which
``@mantisvision/ryskdownloader`` can utilize in two ways:
1. RYS1 and RYS2 data file format contains a map akin to mp4 MOOV atom
2. RYS0 and older file formats can be used with the very similar manifest file as described above. The only difference is
that instead of ``[integer,string]`` tuple, the data array contains ``[integer,integer]`` tuple where the first element is
a frame number as before and the second is its offset in bytes from the beginning of the file.

## SPACK/SPLINTER data file
Both these file formats already contain the map of the keyframes, so there's no need for the separate manifest file.

## Format of data files

### Type
First 3 bytes of the file specify the type of data in ASCII encoding. Currently, the type is either SYK, RYS, SPK or SPL.

The fourth byte of file is numeric representation of version. Thus in theory, the version can range from 0 to 255. Currently,
the known data formats are SYK0, SYK1, RYS0, RYS1, RYS2, SPK1 and SPL1.

When an instance of [RYSKDecoder](./decoder.md) is created, as the first parameter its constructor accepts this specific string representation of the data format.

### SYK0, SYK1, RYS1
These file formats don't have a map of frames, so the type is directly followed by the individual frames. Each frame begins with a its size encoded on 4 bytes as an unsigned 32-bit integer
in little endian. Size indicates how many following bytes belong to the frame.

Next 4 bytes specify frame number in an unsigned 32-bit integer in little endian. The size mentioned above includes these
four bytes. The rest is encoded data which needs to be passed to [RYSKDecoder](./decoder.md).

### RYS1
In RYS1 format, the map of frames follows directly the data format. First 4 bytes are unsigned integer in little endian format which tells how many records (=frames) are stored in the map. Then follows the map itself with each record consisting of 4 bytes marking the number of the frame and the next 8 bytes the byte address in the whole file (both in the unsigned little endian integer). The rest is the data of the individual frames as described in [SYK format](#syk0-syk1-rys1).

### RYS2, SPK1
RYS2 and SPK1 have the frame map stored at the end of the file. Instead of number of frames as in the RYS1, the type is followed by the 8 bytes representing the unsigned integer in the little endian format which holds the byte address of the beginning of the map in the file. The map has the same structure as in the case of [RYS1](#rys1).

Following the address are the individual frames described in [SYK format](#syk0-syk1-rys1).

### SPL1
The type is followed by 4 bytes representing a float in little endian endian format which holds the framerate of the video. It's followed by a single byte which states the number of SH and then 8 bytes of the unsigned integer in the little endian which marks the address of the frame map in the file. The frame map has the same structure as in the case of [RYS1](#rys1).

Following the address are the individual frames described in [SYK format](#syk0-syk1-rys1).

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```
yarn add @mantisvision/ryskdownloader
npm install @mantisvision/ryskdownloader
```

## Usage:
You can use RYSKDownloader like this:
```javascript
import RYSKDownloader, { eventTypes } from "@mantisvision/ryskdownloader";

const downloader = new RYSKDownloader("https://example.com/data.bin");
downloader.on(eventTypes.frameDownloaded, event =>
{
	const data = event.data;
	console.log(event.data.frameNo);
});
downloader.start(100);
```
The type of the returned data depends on the decoder. Look at the [@mantisvision/ryskdecoder](./decoder.md) documentation. Regardless of the type, the object always contains `frameNo` property which carries the identification of the decoded frame (=its sequence number).

## Public API
```typescript
/**
 * Creates a new downloader object which will later, after calling start method, connects to a given url, 
 * downloads frames and decrypts them.
 * @param url url from which to download the RYSK data. The URL points either to the data file or to the JSON
 *            manifest if the data is split to multiple separate SYK/RYSK files. The end of the URL (i.e. .json extension)
 *            is taken into account in order to distinguish between these two possibilities.
 * @param minimalRequiredDownloaded optional parameter which specifies how many bytes of the raw data should be downloaded 
 *            before the playback can start. By default it's 40 MB.
 */
constructor(url: string, minimalRequiredDownloaded?: number);
```
```typescript
/**
 * Registers a callback on an event.
 * @param event name of the event. Supported events are:
 *			frame-downloaded: called after the entire frame finishes downloading and is decoded. The decoded data is passed as the parameter.
 *			error: called on error
 *			decoding-paused: called in a case the decoding has paused (e.g. enough frames ahead has been decoded)
 *			downloading-finished: the entire file from the given URL has been downloaded
 *			downloading-started: downloading has just started
 * @param callback function to call on a specified event
 */
on(event: eventTypes.frameDownloaded, callback: (param?: { data: Decoded, type: eventTypes.frameDownloaded}) => void): void;
on(event: eventTypes.downloadingStarted, callback: (param?: { data: null, type: eventTypes.downloadingStarted}) => void): void;
on(event: eventTypes.downloadingFinished, callback: (param?: { data: number, type: eventTypes.downloadingFinished}) => void): void;
on(event: eventTypes.error, callback: (param?: { data: Error|string, type: eventTypes.error}) => void): void;
on(event: eventTypes.decodingPaused, callback: () => void): void;
```
```typescript
/**
 * Unregister specific callback for an item
 * @param event name of the event
 * @param callback function to unregister
 */
off(event: eventTypes, callback: any);
```
```javascript
/**
* Starts downloading and decoding.
* @param {number} frameCount how many frames should be decoded. This is used so you don't unnecessary decode too many frames ahead.
* @param {number} toEnd how much video time is till the end of the video in seconds (used to predict the number of frames to buffer)
*/
async start(frameCount, toEnd?);
```
```javascript
/**
 * Pause downloading/decoding. This method is asynchronous and is advisable wait till the returned promises resolves to make sure
 * that downloading has stopped.
 */
async pause();
```
```typescript
/**
 * Resume paused downloading
 * @param {Integer} frameCount how many frames should be decoded after the downloading resumes
 * @param {Integer} frameToResume number of the first frame which should be decoded after the decoding is resumed.
 *                  If not given, the decoding continues from the frame where it was paused.
 * @param {Integer} toEnd how much video time is till the end of the video in seconds (used to predict the number of frames to buffer)
 */
async resume(frameCount: number, frameToResume: number|null = null, toEnd?: number);
```
```typescript
/**
 * Completely stops the download process.
 */
cancel();
```
```typescript
/**
 * Resets decoding of frames back to the very first frame.
 * @param {Integer} frameCount how many frames should be decoded ahead
 * @param {Integer} frameToResume number of the first frame the decoding starts with
 *                  If not given, the decoding starts with frame 0.
 * @param {number} toEnd how much video time is till the end of the video in seconds (used to predict the number of frames to buffer)
 */
async reset(frameCount: number, frameToResume: number = 0, toEnd?: number);
```
```typescript
/**
 * Jump to a specific frame in RYSK/SYK file(s).
 * @param {number} frameNo number of the frame which should be seek
 * @param {number} forwardRead how many frames ahead should be read 
 * @param {Integer} toEnd how much video time is till the end of the video in seconds (used to predict the number of frames to buffer)
 */
async jumpAt(frameNo: number, forwardRead: number, toEnd?: number);
```
```typescript
/**
 * Call downloader to buffer some data.
 * @param toEnd how many seconds remain to the end of the media. This is used to count how much data needs to be prebuffered.
 */
bufferData(toEnd: number);
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

## Release notes

### 0.5.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

#### 0.5.1
*BUGFIX* when the video jumped to a different time and it didn't contain a framemap, downloader was unnecessary
sending all the frames from the very first one to the buffer which might have caused the buffer exhausting its
capacity too quickly.

#### 0.5.2
*BUGFIX* solved a couple of racing conditions issues.

#### 0.5.3
*BUGFIX* Do not pause download after resume method was called (this sometimes caused permanent halt of the download).

#### 0.5.7
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

### 0.6.0
Added a mechanic which guesses the download speed of the RYSK data and waits an approximate time till the enough data is downloaded.

#### 0.6.1
Fixed bug with the call to resume the downloader (if it was called with the frame number 0, the downloader didn't jump to the beginning of the file).

#### 0.6.2
Downloader now remembers the number of the last frame in the .syk file. When a jump to a different frame is attempted, it is checked against this number and if the requested frame is higher, it is assumed that in fact the frame number 0 was requested, so it starts the download process from the beginning.

#### 0.6.3
Fixed a typo in a log

#### 0.6.4
Previously, if the .syk file started with a higher frame (e.g. 50), when a jump occurred, the downloader was ordered to download too many frames ahead because it assumed that the .syk file starts with the frame 0. Now it should correctly process the file till it finds the requested frame and only then start to count how many frames it should download ahead.

### 0.7.0
In case of SYK or RYSK0 type data files, the downloader will now pro-actively creates a map of all keyframes in order to allow jumps to different timestamps without the need to download the .syk file from the beginning.

#### 0.7.1
Fixed searching for a chunk of data with the nearest frame - previously, the algorithm sometimes returned an index of a frame one point lower than the searched one.

### 0.8.0
Added caching of .syk files into IndexedDB where available. The caching is made to persist only a single session in the browser.

### 0.9.0
Added SPACK decoder to the downloader.

### 0.10.0
Added SPLINTER decoder to the downloader.

### 0.11.0
Various caching fixes.

### 0.11.5
Name of the IndexedDB is constructed as the hostname of the URL with the data file plus path plus size of the file, thus omitting the url search query part. This is to avoid the same file being cached multiple times if the query string is the only thing which changes (typically when using signed URLs from CDN).

#### 0.11.6
Added OPFS as an alternative to IndexedDB in RYSKDownloader. It's being as the default storage for the buffer of the raw downloaded data. However, it is used only in the worker and if the methods for the "sync" read and write are available.

#### 0.11.7
Removed unnecessary commit in a transaction.

#### 0.11.8
- Second buffering of the same file which is downloaded more than once at the same time will always go into IndexedDB due to very strict access control to an OPFS file.  
- Limit the size of in-memory queue in initial buffering to 16-times the max size of the queue when not in the buffering mode. This usually equals 16 * minimaldownloadeddata.
- *BUGFIX* Attempt to fix a bug when with the ryskdownloader waiting for a chunk of the data file indefinitely because it hasn't noticed the download loop has already finished.

### 0.12.0
Added `bufferData()` method to the `RyskDownloader` which forces to run the intelligent buffering even after the first buffer has been finished.

#### 0.12.1
Fixes regarding the buffering. The downloader no longer halts after the buffering is finished. Fixed subsequent buffering guessing the time to buffer incorrectly.
