# RYSKaframe
This is an attempt to integrate RYSK libraries with a-frame. Since A-Frame doesn't use node.js package architecture
in the usual way and relies on global variable ``AFRAME``, this package had to be composed in the similar manner.

If you intend to use the package together with other node.js packages and install it either through yarn or npm, the
package depends on ``@mantisvision/ryskstream``, ``@mantisvision/ryskurl`` and ``aframe`` packages. Bear in mind that 
different versions of A-Frame library don't work very well together, so check if the version required by ``@mantisvision/ryskaframe``
is the same as the one you are using, otherwise you may end up with two different versions installed. Even if it comes
to this, ``@mantisvision/ryskaframe`` doesn't actually import ``aframe`` library inside its source; instead it expects 
that you'll be the one doing the import, so you can ensure you use the right (i.e. your own) version.

Alternatively you can use the minified version of ``@mantisvision/ryskaframe`` which is bundled in the same package
and contains all its ``@mantisvision/rysk*`` dependencies withing itself.

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskthreejs
npm install @mantisvision/ryskaframe
```
You can also just download the package from its repository, decompress and use only minified version ``MantisRYSKaframe.min.js``.

## Usage
You can import the library like this:
```javascript
import "aframe";

import("@mantisvision/ryskaframe").then(() => /* custom code */);;
```
A-Frame doesn't need to be imported in the same file as ``@mantisvision/ryskaframe``, but it needs to be imported prior
to ``@mantisvision/ryskaframe``, otherwise an exception shall be thrown.

Minified version can be loaded via HTML ``<script>`` tag in the header:
```html
<script src="./scripts/aframe.min.js"></script>
<script src="./scripts/MantisRYSKaframe.min.js"></script>
```
It has no dependencies (everything is bundled inside), but again, aframe must be loaded prior to it.

``@mantisvision/ryskaframe`` registers two new components within A-Frame: ``ryskurl`` and ``ryskstream``.
For convenience, it also registers two corresponding primitives: ``<mantis-ryskurl></mantis-ryskurl>`` 
and ``<mantis-ryskstream></mantis-ryskstream>``.

### ryskurl
This component is used to create a 3D animated mesh from pre-recorded video and SYK/RYSK volumetric data:
```html
<a-scene>
	<a-entity 
		position="0 0 -2" 
		ryskurl="loop:false; data: https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.syk; video: https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.mp4" >
	</a-entity>
</a-scene>
```

#### Schema
ryskurl component is based on the following schema:
```javascript
{
	video: { type: "string", default: '' },
	data: { type: "string", default: '' },
	buffer: { type: "int", default: 50 },
	loop: { type: "boolean", default: true },
	volume: { type: "number", default: 0 },
	time: { type: "number", default: 0 },
	playbackrate: { type: "number", default: 1 },
	preview: { type: "all"|"full"|true|1|"partial"|2|"disabled"|false|0, default: 1 }
}
```
- video: url of the video for the texture of the mesh
- data: url of the SYK/RYSK volumetric data
- buffer: size of data buffer 
- loop: marks if the video should loop after it ends
- volume: volume level from 0 (mute) to 1 (full volume)
- time: current timestamp of the video (can be used for e.g. progress bar)
- playbackrate: playback rate of the video with 1 being the default, normal playback (as well as the default value), higher is faster speed and lower is slower
- preview: whether the mesh should be displayed even before the playback starts ore immediately after the user jumps to a different timestamp. "all", "full", true and 1 are synonyms and enable full preview (default), "partial" and 2 enable partial preview (only mesh without a texture) and "disabled", false and 0 completely disable the preview.

#### Event listeners
ryskurl listens for the following events that you can emit on its element (i.e. ``<a-entity>`` or 
``<mantis-ryskurl></mantis-ryskurl>``):

- ryskpause: pauses the video
- ryskplay: resumes playing

#### Emitted events
ryskurl emits the following events on its element (i.e. ``<a-entity>`` or  ``<mantis-ryskurl></mantis-ryskurl>``). None
of the events bubbles, so you have to attach your listeners directly to the element.

- buffering: video or data is buffering
- buffered: video and data are buffered
- bufferingData: RYSK/SYK data is being buffered
- dataBuffered: RYSK/SYK data is being buffered
- dataDecoded: one frame of SYK/RYSK data is decoded; the payload of the event contains the decoded data:
	- frameNo: sequence number of the decoded frame
	- uvs: typed array of uvs
	- indices: typed array of indices
	- vertices: typed of vertices
- waiting: video is buffering
- playing: video started/resumed playing
- timeupdate: proxy for the same named event of the HTMLVideo element. The payload of the event contains the following properties:
	- duration: length of the video in seconds
	- currentTime: current video timestamp in seconds
- ended: video has finished playing

#### mantis-ryskurl primitive
For your convinience, there is mantis-ryskurl primitive:
```html
<mantis-ryskurl 
	position="0 0 -2" 
	loop="false" 
	dataurl="https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.syk" 
	videourl="https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.mp4" >
</mantis-ryskurl>
```
Compenent properties are mapped to the HTML attributes in the following way:
- video: videourl
- data: dataurl
- buffer: buffer
- loop: loop
- volume: volume

### ryskstream
This component creates a 3D mesh from media stream and SYK/RYSK volumetric data which must be periodically delivered
through the emitting of an event on the HTML tag which bears the component.
```html
<a-scene>
	<a-entity 
		position="0 0 -2" 
		ryskstream="videoelem: videosource" >
	</a-entity>
</a-scene>
```

#### Schema
ryskstream component is based on the following schema:
```javascript
{
	videoelem: { type: "string", default: '' },
	width: { type: "int", default: 0 },
	height: { type: "int", default: 0 },
	volume: { type: "number", default: 0 }
}
```
- videoelem: id of the videoelement which will serve as the source of the media stream. Alternatively, media stream can be passed directly through the newdata event (see below)
- width: width resolution of the video; if not given, it either read from videoelem or from the data that came through the data event
- height: height resolution of the video; if not given, it either read from videoelem or from the data that came through the data event
- volume: volume level from 0 (mute) to 1 (full volume)

#### Event listeners
ryskstream listens for the following events that you can emit on its element (i.e. ``<a-entity>`` or 
``<mantis-ryskstream></mantis-ryskstream>``):
- newdata: this event should emitted each a new data has arrived. The following object should be passed as the payload:
	- version: version of the RYSK/SYK data 
	- data: Array buffer containing encoded RYSK/SYK data
- newstream: instead of giving id of the video element through the HTML attribute, you can emit this event and as the payload pass directly the mediastream in the following object:
	- width: width resolution of the video passed in the stream
	- height: height resolution of the video passed in the stream
	- stream: MediaStream object

#### Emitted events
ryskstream emits the same events as ryskurl (see above)

#### mantis-ryskstream primitive
For your convinience, there is a mantis-ryskstream primitive:
```html
<mantis-ryskstream 
	position="0 0 -2" 
	videoelem="videosource" >
</mantis-ryskstream>
```
Component properties are mapped to the HTML attributes in the following way:
- videoelem: videoelem
- width: width
- height: height
- volume: volume

## Release notes

### 0.5.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

### 0.6.0
Closely connected to the 3.1.0 release of ``@mantisvision/ryskurl``. A new attribute ``preview`` is added to the ``ryskurl`` component. It can be set to ``disabled`` (default; equals to false of ``RYSKUrl`` class), ``full`` (equals to true of ``RYSKUrl`` class) or ``partial``. The last one shows an untextured mesh when the RYSK object into the scene (in theory, it should save some bandwidth).

#### 0.6.3
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

### 0.7.0
A new attribute ``playbackrate`` us added to the ``ryskurl`` component. It can control the speed of the video playback.

### 0.8.0
A new attributes ``beginning`` and ``end`` (values given in seconds) which can trim the video to a desired length.

#### 0.8.4
Important bugfix from [0.6.2](./buffer.md#062) release of ``@mantisvision/ryskbuffer``.
