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
You can use this library either with the raw PlayCanvas engine or integrate it into the PlayCanvas editor.

### PlayCanvas engine
You can import the library in the following way:
```javascript
import { URLMesh, StreamMesh } from "@mantisvision/ryskplaycanvas";

const ryskUrl = new URLMesh("video_url","data_url");
const ryskStream = new StreamMesh(MediaStream);
```

``playcanvas`` library is listed among the peer dependencies of ``@mantisvision/ryskplaycanvas``. This is to avoid the issue with simultaneously using two different ``playcanvas`` libraries in one project which would most likely break the functionality of the application. There is even an option to pass the main ``playcanvas`` object as a constructor parameter of ``URLMesh`` and ``StreamMesh``:

```javascript
import { URLMesh, StreamMesh } from "@mantisvision/ryskplaycanvas";
import * as PlayCanvas from "playcanvas";

const ryskUrl = new URLMesh("video_url", "data_url", bufferSize, PlayCanvas);
const ryskStream = new StreamMesh(MediaStream, PlayCanvas);
```
where ``buffersize`` is an initial size of the RYSK data buffer (by default it's 50) and ``PlayCanvas`` is the main object of PlayCanvas engine library.

Alternatively, ``MantisRYSKPlayCanvas.min.js`` file can be used on its own. It creates ``window.Rysk`` global variable
which contains ``URLMesh`` and ``StreamMesh`` classes. When using PlayCanvas editor, this file needs to be uploaded as 
an asset and then imported inside a custom script attached to an entity. An example of such a script is packed together
with ``MantisRYSKPlayCanvas.min.js`` inside ``examples`` subdirectory.
The call to construct both classes is slightly different:

```javascript
const ryskUrl = new window.Rysk.URLMesh("video_url", "data_url", bufferSize, PlayCanvas);
const ryskStream = new window.Rysk.StreamMesh(MediaStream, PlayCanvas);
```
in this case, the ``PlayCanvas`` object is usually reference to ``window.pc``, though this specifically depends on the way you include the library. It is up to you to ensure ``playcanvas`` is loaded before ``@mantisvision/ryskplaycanvas``, either through the ``import`` statement/function or as a ``<script>`` tag in HTML code.

It is important to periodically call ``update`` method on ``URLMesh`` and ``StreamMesh`` objects to ensure that both mesh
and texture get updated with the new data each frame. One way to do that is to call ``update`` inside ``frameupdate``
callback of the PlayCanvas application, for instance like this:
```javascript
import { URLMesh } from "@mantisvision/ryskplaycanvas";

// playcanvas is the global object of PlayCanvas engine
const app = new playercanvas.Application(canvas);
const ryskObj = new URLMesh(video_url,data_url,playcanvas);

app.on("frameupdate",() => ryskObj.update());
...
```

### PlayCanvas editor
Currently, the Playcanvas editor doesn't work with npm packages, so you have to use minified version of the library in
the file ``MantisRYSKPlayCanvas.min.js``. You have to uploaded to your project as an asset, create an entity which will
represent a RYSK 3D mesh, add a new empty script to it and inside it import the library, e.g. like this:

```javascript
const asset = pc.Application.getApplication().assets.find('MantisRYSKPlayCanvas.min.js');
import(asset.getFileUrl()).then(() => 
{//from now on, you can use window.RYSK global object.
 //the third parameter is the size of the internal RYSK frame buffer (by default 50) and the fourth global PlayCanvas object
	this.ryskObj = new window.Rysk.URLMesh(video_url, data_url, 50, pc); 
	this.ryskObj.play();
	return this.ryskObj.run();
}).then(entity => 
{//add the created mesh to this entity as its render component
	entity.enabled = true; //entity is by default disabled
	this.entity.addChild(entity);
});
```
PlayCanvas scripts attached to entities can have an ``update`` method which is automatically called on each redraw.
It is therefore an ideal place to put the call to the ``update`` method of the RYSK object. However, on older version
of Safari browser and Firefox might exhibit a synchronization issue between the mesh and its texture. In order to fix
it, the ``update`` method of the RYSK object should be called in ``window.requestAnimationFrame`` callback instead.

An example PlayCanvas editor script ins included in the npm package in ``examples`` folder. It should be attached to the
entity which ought to represent the 3D mesh in the scene and can be configured through its attributes. 

## Public API:
Exported class ``URLMesh`` extends class ``RYSKUrl`` from ``@mantisvision/ryskurl`` and exported class ``StreamMesh``
extends class ``RYSKStream`` from ``@mantisvision/ryskstream``. You can find the description of their API [here](./ryskurlryskstream.md).

Instead of ``init`` method, you should call ``URLMesh.run()`` and ``StreamMesh.run(videoWidth, videoHeight)``. Instead of canvas,
these methods resolve with PlayCanvas entity object which can be used in the scene. Object's texture and geometry gets 
automatically updated; there is therefore no need to listen on ``dataDecoded`` event from parent classes. However, it
is still necessary to call ``update()`` method on ``URLMesh`` or ``StreamMesh`` to ensure new frames from video/stream
are read on all browsers.

There is one new method ``getEntity()`` which works similarly to ``getCanvas()``, but returns PlayCanvas entity instead
(remember that both these methods work only after ``run()`` method is called for the first time, otherwise they return 
null).

WARNING! Even though ``run`` method is marked as async, you shouldn't structure your code in a way you "await" till ``run`` resolves
and only then call ``play``. In order to resolve with a mesh, ``run`` method requires you to also call ``play`` (before or after)
because the mesh can only be constructed after at least one frame from the video is played.

The previous restriction can be bypassed by setting the preview mode via ``setPreviewMode(true)`` method. The method is inherited from ``RYSKUrl``, but here it's effect is even more prominent as it also allows to obtain the PlayCanvas entity from the ``run()`` method prior to calling the ``play()``. Furthermore, the method is expanded by allowing to pass not only ``true`` or ``false``, but also values from the ``PreviewMode`` enum; namely:
- ``PreviewMode.disabled`` - same as passing ``false``
- ``PreviewMode.full`` - same as passing ``true``
- ``PreviewMode.partial`` - the new mode which at the beginning shows only gray, untextured mesh (i.e. doesn't internally call ``play()`` on the video texture). This can save some bandwidth and is in theory less prone to provoke a negative reaction from the browser due to autoplay restrictions. It is worth noting that the behavior when calling the ``jumpAt()`` method remains the same with the ``partial`` and the ``full`` modes (so the mesh is once again fully textured and not just gray).

RYSKUrl example using PlayCanvas engine library:
```javascript
import { URLMesh, PreviewMode } from "@mantisvision/ryskplaycanvas";
import * as pc from "playcanvas";

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
camera.setPosition(0, 1.5, 2.2);
camera.setEulerAngles(-13, 0, 0);

// create directional light entity
const light = new pc.Entity('light');
light.addComponent('light');
app.root.addChild(light);
light.setEulerAngles(45, 180, 0);

const ryskObj = new URLMesh(video_url,data_url);
//shows the RYSK mesh even before play() is called
ryskObj.setPreviewMode(PreviewMode.full);

ryskObj.run().then(entity => 
{//add entity to the scene
	entity.enabled = true; //entity is by default disabled
	app.root.addChild(entity);
}); 

app.start();
app.on("frameupdate",() => ryskObj.update());
...
// later on, call play (for instance after a user clicks on a button)
ryskObj.play();
```

## Release notes

### 0.6.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

### 0.7.0
PlayCanvas engine library is now listed among dependencies and it is not required to provide it through the constructor
of ``URLMesh`` / ``StreamMesh``.

### 0.8.0
- Closely connected to the 3.1.0 release of ``@mantisvision/ryskurl``. A new method ``setPreviewMode(mode: boolean|PreviewMode)`` is added to the ``URLMesh`` class. In addition to the same named method from ``RYSKUrl`` which it overrides, this one allows to set the preview to the partial mode (value 2) which shows an untextured mesh when the RYSK object into the scene (in theory, it should save some bandwidth).
- playcanvas library in its npm form is listed as a "peer dependency" in package.json. This is an attempt to avoid potential conflicts between various versions of this library.

#### 0.8.3
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability.

### 0.9.0
Breaking change! ``run()`` method no longer returns a mere mesh instance object, but the whole entity instead. The entity is correctly rotated and scaled and can be added directly to the scene or as a child under another entity.
Due to the same change, ``getMesh()`` method has been renamed to ``getEntity()``.

#### 0.9.1
Minified version of ``@mantisvision/ryskplaycanvas`` (which bundles all the dependencies) now exports also ``RYSKUrl`` class from the bundled ``@mantisvision/ryskurl`` library.

### 0.10.0
Connects to 3.2.0 release of ``@mantisvision/ryskurl``.
