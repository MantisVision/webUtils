# RYSKThreejs
This an integration of ``@mantisvision/rysk*`` libraries with Three.js in order to produce a self-updating 3D mesh
usable in a Three.js scene. Originally, this was done in ``@mantisvision/ryskurl`` and ``@mantisvision/ryskstream``
packages, but was later decoupled from them as to make it easier for third party developers to integrate RYSK/SYK with
their own rendering engines.

``@mantisvision/ryskthreejs`` depends on both ``@mantisvision/ryskstream`` and ``@mantisvision/ryskurl``, as well as on
Three.js-

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

There is, however, a notable difference in the methods ``URLMesh.run()`` and ``StreamMesh.run()``. Instead of canvas,
these methods resolve with Three.js mesh object which can be used in the scene. Object's texture and geometry gets 
automatically updated; there is therefore no need to listen on ``dataDecoded`` event from parent classes. However, it
is still highly advisable to call ``update()`` method on ``URLMesh`` or ``StreamMesh`` to ensure new frames from video/stream
are read on all browsers.

There is one new method ``getMesh()`` which works similarly to ``getCanvas()``, but returns Three.js mesh instead
(remember that both these methods work only after ``run()`` method is called for the first time, otherwise they return 
null).

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

ryskObj.run().then(mesh => 
	{
		requestAnimationFrame(animate);
		/* do something with the mesh */
	}).catch(err => console.error(err));
```