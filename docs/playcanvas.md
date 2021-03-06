# RyskPlayCanvas
This an integration of ``@mantisvision/rysk*`` libraries with web-based 3D engine PlayCanvas in order to produce self-updating 
3D mesh usable in a PlayCanvas scene. The NPM package can be used wit the raw engine itself, but also inside PlayCanvas Editor.
For this purpose, a minified version of the library and its dependencies together with an example script are included.

``@mantisvision/ryskplaycanvas`` depends on both ``@mantisvision/ryskstream`` and ``@mantisvision/ryskurl``. These, however,
aren't necessary if ``MantisRYSKPlayCanvas.min.js`` file is used (for instance directly in HTML page) as it contains all
the dependencies within itself and as such it's meant for the use mainly inside PlayCanvas editor. If the package is 
imported in an ordinary web application using yarn or npm (and later bundled with e.g. webpack), PlayCanvas engine library
must also be somehow present and its main object is passed to the constructors of URLMesh and URLStream objects.

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskplaycanvas
npm install @mantisvision/ryskplaycanvas
```

## Usage:
You can use this library in the following way:
```javascript
import { URLMesh, StreamMesh } from "@mantisvision/ryskplaycanvas";

const ryskUrl = new URLMesh("video_url","data_url",PlayCanvas);
const ryskStream = new StreamMesh(MediaStream,PlayCanvas);
```
where ``PlayCanvas`` is the main object of PlayCanvas engine library (usually ``window.pc``). Note that the current 
PlayCanvas engine library doesn't exist in npm package form and so it can't be listed as a dependency. It is up to you
to ensure this library is loaded before ``@mantisvision/ryskplaycanvas``, either through ``import`` statement/function
or as a ``<script>`` tag in HTML code.

Alternatively, ``MantisRYSKPlayCanvas.min.js`` file can be used on its own. It creates ``window.Rysk`` global variable
which contains ``URLMesh`` and ``StreamMesh`` classes. When using PlayCanvas editor, this file needs to be uploaded as 
an asset and then imported inside a custom script attached to an entity. An example of such a script is packed together
with ``MantisRYSKPlayCanvas.min.js`` inside ``examples`` subdirectory.

It is important to periodically call ``update`` method on ``URLMesh`` and ``StreamMesh`` objects to ensure that both mesh
and texture get updated with the new data each frame. One way to do that is to call ``update`` inside ``frameupdate``
callback of the PlayCanvas application, for instance like this:
```javascript
import { URLMesh } from "@mantisvision/ryskplaycanvas";

// playercanvas is the global object of PlayerCanvas engine
const app = new playercanvas.Application(canvas);
const ryskObj = new URLMesh(video_url,data_url,playercanvas);

app.on("frameupdate",() => ryskObj.update());
...
```

When used inside PlayCanvas editor in a custom script, it is recommended to call it inside update method of your
custom PlayCanvas editor script.

## Public API:
Exported class ``URLMesh`` extends class ``RYSKUrl`` from ``@mantisvision/ryskurl`` and exported class ``StreamMesh``
extends class ``RYSKStream`` from ``@mantisvision/ryskstream``. You can find the description of their API [here](./ryskurlryskstream.md).

There is, however, a notable difference in the methods ``URLMesh.run()`` and ``StreamMesh.run()``. Instead of canvas,
these methods resolve with PlayCanvas MeshInstance object which can be used in the scene. Object's texture and geometry gets 
automatically updated; there is therefore no need to listen on ``dataDecoded`` event from parent classes. However, it
is still necessary to call ``update()`` method on ``URLMesh`` or ``StreamMesh`` to ensure new frames from video/stream
are read on all browsers.

There is one new method ``getMesh()`` which works similarly to ``getCanvas()``, but returns PlayCanvas MeshInstance instead
(remember that both these methods work only after ``run()`` method is called for the first time, otherwise they return 
null).

RYSKUrl example using PlayCanvas engine library:
```javascript
import { URLMesh } from "@mantisvision/ryskplaycanvas";

const canvas = document.getElementById('playcanvas');
const app = new pc.Application(canvas);
const scene = app.scene;

app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

//create camera
const camera = new pc.Entity('camera');
camera.addComponent('camera', {
	clearColor: new pc.Color(1, 1, 1),
	projection: pc.PROJECTION_PERSPECTIVE,
	fov: 70
});
app.root.addChild(camera);
camera.setPosition(0, 1.5, -1);
camera.setEulerAngles(0, 180, 0);

// create directional light entity
const light = new pc.Entity('light');
light.addComponent('light');
app.root.addChild(light);
light.setEulerAngles(45, 180, 0);

const ryskObj = new URLMesh(video_url,data_url,pc);

ryskObj.run().then(meshInstance => 
{//add mesh to the scene
	meshInstance.visible = true;
	const entity = new pc.Entity();

	entity.addComponent('render',{ meshInstances: [meshInstance] });		

	app.root.addChild(entity);
	entity.setPosition(0,0,1)
	const scale = new pc.Vec3(0.001,0.001,0.001);
	entity.setLocalScale(scale);
}); 

app.start();
app.on("frameupdate",() => ryskObj.update());
ryskObj.play();
...
```
