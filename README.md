# webUtils
This public repository hosts a package registry containing ``@mantisvision`` javascript libraries. Source codes of the hosted packages are located in a private MantisVision repositiry.
NPM packages can be downloaded from https://npm.pkg.github.com registry using the scope ``@mantisvision``. The main library ``@mantisvision/rysk`` is meant to be working alongside
[Three.js](https://threejs.org/) which is also listed as one of its dependencies.

There is a sample project using RYSKUrl class of ``@mantisvision/rysk`` package in [samples/url](samples/url) directory. Description of the sample with the instructions to run it are in [samples/url/README.md](samples/url/README.md).

## Installing a package in your project
You can install any of the published packages with its dependencies using either Yarn (v1 or v2) or NPM. You have to
specify the custom package registry for ``@mantisvision`` packages. For npm, you have to edit either your global or your
project's ``.npmrc`` file and add the following line:
```
@mantisvision:registry=https://npm.pkg.github.com
```
For Yarn v1, you have to edit ``.yarnrc`` and add the following line:
```
"@mantisvision:registry" "https://npm.pkg.github.com"
```
For Yarn v2, you have to edit ``.yarnrc.yml`` and add the following:
```yaml
npmScopes:
  mantisvision:
    npmRegistryServer: "https://npm.pkg.github.com"
    npmAuthToken: "your_git_auth_token_here"
```
In order to install a specific package using NPM, run one of the following commands:
```
npm i @mantisvision/rysk
npm i @mantisvision/sentryintegration
```
If you prefer using Yarn, run one of the following:
```
yarn add @mantisvision/rysk
yarn add @mantisvision/sentryintegration
```
## Using a package in your source codes
### RYSK
This package exposes two classes: RYSKUrl and RYSKStream. They can be imported in your javascript file like this:
```javascript
import { RYSKUrl, RYSKStream }  from "@mantisvision/rysk" //javascript native module style
const { RYSKUrl, RYSKStream } = require("@mantisvision/rysk"); // Node.js style
```

#### RYSKUrl
This class is meant for downloading video files and SYK/RYSK data from the given URL.
In order to obtain a Three.js mesh, a new object of this imported class needs to be created:
```javascript
const ryskObj = new RYSKUrl("video_url","data_url");
```
``data_url`` can point to data in one of these three formats:
* SYK1
* SYK2
* RYSK

The process of generating the Three.js mesh can be started by invoking ``run`` method on the object. It returns a promise
which resolves with the mesh:
```javascript
ryskObj.run()
	.then(mesh =>
	{ /* do something with the mesh */ })
	.catch(err => console.error(err));
```
The same mesh can be later (after invoking ``run``) obtained also by calling
```javascript
const mesh = ryskObj.getMesh();
```
In order to ensure the mesh is updated according to the new frames in the video, ``update`` method has to be called
periodically on the object. One option is to put it into the ``requestAnimationFrame`` callback like this:
```javascript
const animate = () =>
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);

```
There is no need to call ``getMesh`` after each update because it is the original mesh which gets modified according to
the new frames from video and new SYK/RYSK data.

At the end of the lifecycle, it is highly recommended to call ``dispose`` on the rysk object in order to free the system
resources
```javascript
ryskObj.dispose();
ryskObj = null;
```
The full example of usage may look like this:
```javascript
import { RYSKUrl } from "@mantisvision/rysk"

const ryskObj = new RYSKUrl("video_url","data_url");

const animate = () =>
{
	if (ryskObj !== null)
	{
		requestAnimationFrame(animate);
		ryskObj.update();
	}
};

ryskObj.run().then(mesh =>
	{
		requestAnimationFrame(animate);
		ryskObj.play(); //run the animation

		/* do something with the mesh */

		ryskObj.dispose();
		ryskObj = null;
	}).catch(err => console.error(err));
```

#### RYSKStream
This class works with a realtime continuous MediaStream and it needs to be periodically fed by encoded SYK/RYSK data frames.
RYSKStream decodes delivered frames on its own in the separate worker process. Video is being played realtime, and
the mesh is updated only if the SYK/RYSK data for the current frame has already been provided. Otherwise, the current
video frame is skipped and the process continues with the next one.

To create a new instance of the class, a MediaStream object needs to be provided for the constructor:
```javascript
const ryskObj = new RYSKUrl(MediaStream);
```
The process of generating the Three.js mesh can be started by invoking ``run`` method on the object. It returns a promise
which resolves with the mesh. Run method can be invoked with specific video width and video height in case
the MediaStream size isn't constant:
```javascript
ryskObj.run(videoWidth,videoHeight)
	.then(mesh =>
	{ /* do something with the mesh */ })
	.catch(err => console.error(err));
```
The same mesh can be later (after invoking ``run``) obtained also by calling
```javascript
const mesh = ryskObj.getMesh();
```
Encoded SYK/RYSK data are passed using ``addRYSKData`` method. Only data describing a single frame might be used as an
argument. The programmer must ensure the passed data is in sync with the MediaStream. If it arrives only after
the video frame it relates to, the mesh won't even display the frame. The data should not be provided too early as well,
least the exceed buffer capacity which is currently set to 100 frames.
```javascript
ryskObj.addRYSKData("version_of_RYSK_SYK",Uint8ArrayData);
```
In order to ensure the mesh is updated according to the new frames in the video, ``update`` method has to be called
periodically on the object. One option is to put it into the ``requestAnimationFrame`` callback like this:
```javascript
const animate = () =>
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);

```
There is no need to call ``getMesh`` after each update because it is the original mesh which gets modified according to
the new frames from video and new SYK/RYSK data.

At the end of the lifecycle, it is highly recommended to call ``dispose`` on the rysk object in order to free the system
resources
```javascript
ryskObj.dispose();
ryskObj = null;
```
The full example of usage may look like this:
```javascript
import { RYSKStream } from "@mantisvision/rysk"

const ryskObj = new RYSKStream(MediaStream);

const animate = () =>
{
	ryskObj.addRYSKData("RYSK0",data);
	if (ryskObj !== null)
	{
		requestAnimationFrame(animate);
		ryskObj.update();
	}
};

ryskObj.run().then(mesh =>
	{
		requestAnimationFrame(animate);

		/* do something with the mesh */

		ryskObj.dispose();
		ryskObj = null;
	}).catch(err => console.error(err));
```
### SentryIntegration
This package exposes a single class as its default export. It can be imported in your javascript file like this:
```javascript
import SentryIntegration from "@mantisvision/sentryintegration" //javascript native module style
const SentryIntegration = require("@mantisvision/sentryintegration"); // Node.js style
```
Instance of this class can be injected into Sentry during its init state:
```javascript
import * as Sentry from "@sentry/browser";
import SentryIntegration from "@mantisvision/sentryintegration";

Sentry.init({
	integrations: [new SentryIntegration({ measure:true })],
	/* the rest of Sentry config */
});
```
Constructor of exported class can called with a single parameter which contains settings object. Currently, the only
available option is ``measure`` which can be set to ``true`` or ``false`` to turn on/off sending of the statistics to
Sentry.
### Utils
Exports from this package are meant only for internal usage by other ``@mantisvision`` libraries.

## Public API
This is a description of methods and their parameters which are exported for direct use from individual packages:
### RYSKUrl
RYSKUrl is one of two exports from ``@mantisvision/rysk``. It provides the following methods:
```javascript
/**
 * Creates new instance of the class, but doesn't start downloading the data yet.
 * @param {String} videourl url of the video to be downloaded
 * @param {String} dataurl url of the RYSK/SYK data
 */
constructor(videourl,dataurl)
```
```javascript
/**
 * Runs the service and returns a promise which resolves with a three.js mesh.
 * @returns {unresolved} THREE.Mesh when the promise is resolved, null if an error occurs (e.g. incorrect URL).
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
### RYSKStream
RYSKUrl is one of two exports from ``@mantisvision/rysk``. It provides the following methods:
```javascript
/**
 * Creates new instance of the class, but doesn't start downloading the data yet.
 * @param {MediaStream} mediastream stream containing video (and maybe even audio) to create the mesh
 */
constructor(mediastream);
```
```javascript
/**
 * Runs the service and returns a promise which resolves with a three.js mesh.
 * @param {Integer} videoWidth optional (but recommended) parameter with the width of the source MediaStream
 * @param {Integer} videoHeight optional (but recommended) parameter with the height of the source MediaStream
 * @returns {unresolved} THREE.Mesh when the promise is resolved, null if an error occurs (e.g. incorrect URL)
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
### Both RYSKUrl and RYSKStream
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
 * Gets mesh. Must be called after run!
 * @returns {THREE.Mesh|null} if the method is called before run or after dispose, it returns null.
 */
getMesh();
```
```javascript
/**
 * Updates mesh to reflect the current video frame and frame data. To ensure the mesh is trully updated, this method
 * must be called periodically (e.g. in requestAnimationFrame callback).
 * @returns {undefined}
 */
update();
```
```javascript
/**
 * Pauses download of the video and RYSK/SYK data, as well as audio. Therefore, the mesh will not change even if
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
 * Checks whether the video is paused.
 * @returns {Boolean} true if it is, false otherwise.
 */
isPaused();
```
```javascript
/**
 * Registers a callback on an event type. Currently, the only supporter event are error and video.ended
 * @param {String} event name of the event type (either error or video.ended)
 * @param {callable} callback
 * @returns {undefined}
 */
on(event,callback);
```
```javascript
/**
 * Unregister a callback for an event type
 * @param {String} event event name of the event type (either error or video.ended)
 * @param {callable} callback
 * @returns {undefined}
 */
off(event,callback);
```
```javascript
/**
 * It is highly recommended to call this method after the work is finished in order to free the resources. It terminates
 * downloading of SYK/RYSK data, stops the video and disposes geometry and material of three.js mesh.
 */
dispose();
```
### SentryIntegration
Exports a single class as its default export. An instance of this class should be passed to Sentry during its
configuration. Method ``setupOnce`` is called automatically by Sentry.
```javascript
/**
 * Creates an instance of this calss which should be passed to Sentry.
 * @param {Object} options configuration object which currently supports only one parameter:
 *					measure -- if set to true, Transactions will be allowed in SentryInternal package, if false they won't
 */
constructor(options = null)
```
