# RYSKDownloader
This package contains a downloader class which is used for downloading data from the given url, splitting them into frames
and passing those frames to ``@mantisvision/decoder``. Internally it uses standard javascript Streams API together with standard fetch function.
Downloaded data is being continuously split to individual frames and then passed to @mantisvision/decoder.
Each decoded frame data consists of UVs, vertices and indices and is identified by the associated frame number.
(see @mantisvision/decoder documentation).

## SYK/RYSK data file
SYK/RYSK data can be stored either in a single .syk file or they can be split into multiple .syk files, each containing
only the data for certain frames. In the latter case, a manifest must be provided in a form of JSON which primarily describes which
file contains which frames. The JSON format is as follows:
```
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
1. RYS1 data file format contains a map akin to mp4 MOOV atom
2. RYS0 and older file formats can be used with the very similar manifest file as described above. The only difference is
that instead of ``[integer,string]`` tuple, the data array contains ``[integer,integer]`` tuple where the first element is
a frame number as before and the second is its offset in bytes from the beginning of the file.

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

Combining these two information together, we get three possible values for the data format:
* SYK0
* SYK1
* RYS0
When an instance of [RYSKDecoder](./decoder.md) is created, its constructor accepts single argument which is this specific data
format as a string.

If the data is split into multiple SYK/RYSK files, they do not contain the data format, since that one is already
already specified in the separate manifest JSON file.

Following the data format are individual frames. Each frame begins with a its size encoded on 4 bytes as an unsigned 32-bit integer
in little endian. Size indicates how many following bytes belong to the frame. 

Next 4 bytes specify frame number in an unsigned 32-bit integer in little endian. The size mentioned above includes these
four bytes.

The rest is encoded data which needs to be passed to [RYSKDecoder](./decoder.md) which returns decoded uvs, vertices
and indices (see its API).

## Public API
```javascript
/**
 * Creates a new downloader object which will later, after calling connect method, connects to a given url, 
 * downloads frames and decrypts them.
 * @param {String} url url from which to download the RYSK data. The URL points either to the data file or to the JSON
 *                 manifest if the data is split to multiple separate SYK/RYSK files. the end of the URL (i.e. .json extension)
 *                 is taken into account in order to distinguish between these two possibilities.
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
 *			downloading-started: downloading has just started
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
 * Pause downloading/decoding. This method is asynchronous and is advisable wait till the returned promises resolves to make sure
 * that downloading has stopped.
 */
async pause();
```
```javascript
/**
 * Resume paused downloading
 * @param {Integer} frameCount how many frames should be decoded after the downloading resumes
 * @param {Integer} frameToResume number of the first frame which should be decoded after the decoding is resumed. 
 *                  If not given, the decoding continues from the frame where it was paused.
 */
resume(frameCount,frameToResume = null);
```
```javascript
/**
 * Completely stops the download process.
 */
cancel();
```
```javascript
/**
 * Resets decoding of frames back to the very first frame.
 * @param {Integer} frameCount how many frames should be decoded ahead
 * @param {Integer} frameToResume number of the first frame the decoding starts with
 *                  If not given, the decoding starts with frame 0.
 */
reset(frameCount,frameToResume = null);
```
```javascript
/**
 * Jump to a specific frame in RYSK/SYK file(s).
 * @param {Integer} frameNo number of the frame which should be seek
 * @param {Integer} forwardRead how many frames ahead should be read 
 */
async jumpAt(frameNo,forwardRead);
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