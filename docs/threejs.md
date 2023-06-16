# RYSKThreejs
This an integration of ``@mantisvision/rysk*`` libraries with Three.js in order to produce a self-updating 3D mesh
usable in a Three.js scene. Originally, this was done in ``@mantisvision/ryskurl`` and ``@mantisvision/ryskstream``
packages, but was later decoupled from them as to make it easier for third party developers to integrate RYSK/SYK with
their own rendering engines.

``@mantisvision/ryskthreejs`` depends on both ``@mantisvision/ryskstream`` and ``@mantisvision/ryskurl``, as well as on
Three.js.

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskthreejs
npm install @mantisvision/ryskthreejs
```

## Usage:
You can use this library in the following way:
```javascript
import { URLMesh, StreamMesh } from "@mantisvision/rysk";

const ryskUrl = new URLMesh("video_url","data_url");
const ryskStream = new StreamMesh(MediaStream);
```

## Public API:
Exported class ``URLMesh`` extends class ``RYSKUrl`` from ``@mantisvision/ryskurl`` and exported class ``StreamMesh``
extends class ``RYSKStream`` from ``@mantisvision/ryskstream``. You can find the description of their API [here](./ryskurlryskstream.md).

### API differences
The constructors can be passed one more parameter (fourth in case of ``URLMesh`` and second in case of ``StreamMesh``) which sets the color space of the underlying video texture. Default value is whatever the current three.js version uses as default (currently r153 uses THREE.NoColorSpace).

```javascript
import { URLMesh, StreamMesh } from "@mantisvision/rysk";
import * as THREE from "three";

// the third parameter is the initial size of the buffer and the fourth is the colorspace
const ryskUrl = new URLMesh("video_url", "data_url", 50, THREE.SRGBColorSpace);

//the second parameter is the color space
const ryskStream = new StreamMesh(MediaStream, THREE.SRGBColorSpace);
```

Instead of ``init`` method, you should call ``URLMesh.run()`` and ``StreamMesh.run(videoWidth, videoHeight)``. Instead of canvas,
these methods resolve with Three.js mesh object which can be used in the scene. Object's texture and geometry gets 
automatically updated; there is therefore no need to listen on ``dataDecoded`` event from parent classes. However, it
is still necessary to call ``update()`` method on ``URLMesh`` or ``StreamMesh`` to ensure new frames from video/stream
are read on all browsers.

There is one new method ``getMesh()`` which works similarly to ``getCanvas()``, but returns Three.js mesh instead
(remember that both these methods work only after ``run()`` method is called for the first time, otherwise they return 
null).

WARNING! Even though ``run`` method is marked as async, you shouldn't structure your code in a way you "await" till ``run`` resolves
and only then call ``play``. In order to resolve with a mesh, ``run`` method requires you to also call ``play`` (before or after)
because the mesh can only be constructed after at least one frame from the video is played.

## Examples
This is an example of how to use ``URLMesh``:

```javascript
import { URLMesh } from "@mantisvision/ryskthreejs";

const ryskObj = new URLMesh("video_url","data_url");

const animate = () => 
{
	if (ryskObj !== null)
	{
		requestAnimationFrame(animate);
		ryskObj.update();
	}
};

ryskObj.on(RyskEvents.videoEnded,() => 
{ 
	ryskObj.dispose();
	/* free the resources, clean up */ 
});

ryskObj.run().then(mesh => 
{
	requestAnimationFrame(animate);
	/* do something with the mesh */
}).catch(err => console.error(err));

ryskObj.play(); //be aware that if you "await" till "run" resolves and only then call play(), you will block yourself.
```

This is an example of how to use ``StreamMesh``:

```javascript
import { StreamMesh } from "@mantisvision/ryskthreejs";

const ryskObj = new StreamMesh(media_stream);

const animate = () => 
{
	if (ryskObj !== null)
	{ // pass encoded data to RYSKStream
		ryskObj.addRYSKData("RYSK0",data);
		requestAnimationFrame(animate);
		ryskObj.update();
	}
};

// StreamMesh run method requires videoWidth and videoHeight of the stream. Be mindful that this should be
// the size of the original video! Should you provide the video size after scaling it up/down (for example due 
// to webRTC scaling it up/down to fit the network bandwidth), the library will have trouble to read the correct
// frame number from it!
ryskObj.run(videoWidth, videoHeight).then(mesh => 
	{
		requestAnimationFrame(animate);
		/* do something with the mesh */
	}).catch(err => console.error(err));

ryskObj.play(); //be aware that if you "await" till "run" resolves and only then call play(), you will block yourself.
```
## Release notes

### 0.8.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

### 0.9.1
``URLMesh`` and ``StreamMesh`` constructors get additional parameter which can be used to set the color space of the texture.
Default value is whatever the current three.js version uses as default (currently r153 uses THREE.NoColorSpace).
