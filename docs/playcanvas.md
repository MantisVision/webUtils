# RyskPlayCanvas
This an integration of ``@mantisvision/rysk*`` libraries with web-based 3D engine PlayCanvas in order to produce self-updating 
3D mesh usable in a PlayCanvas scene. The NPM package can be used with the raw engine itself, but also inside PlayCanvas Editor.
For this purpose, a minified version of the library and its dependencies together with an example script are included.

``@mantisvision/ryskplaycanvas`` depends on both ``@mantisvision/ryskstream`` and ``@mantisvision/ryskurl``. These, however,
aren't necessary if ``MantisRYSKPlayCanvas.min.js`` file is used (for instance directly in HTML page) as it contains all
the dependencies within itself and as such it's meant for the use mainly inside PlayCanvas editor. If the package is 
imported in an ordinary web application using yarn or npm (and later bundled with e.g. webpack), PlayCanvas engine library
must also be somehow present and its main object must be passed to the constructors of URLMesh and URLStream objects.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/ryskplaycanvas
npm install @mantisvision/ryskplaycanvas
```

## Usage:
You can use this library either with the raw PlayCanvas engine or integrate it into the PlayCanvas editor.

### PlayCanvas engine
You can import the library in the following way:
```javascript
import { URLMesh, StreamMesh } from "@mantisvision/ryskplaycanvas";

const ryskUrl = new URLMesh({
	mediaurl: "video_url",
	dataurl: "data_url"
});
const ryskStream = new StreamMesh({
	mediastream: MediaStream
});
```

``playcanvas`` library is listed among the peer dependencies of ``@mantisvision/ryskplaycanvas``. This is to avoid the issue with simultaneously using two different ``playcanvas`` libraries in one project which would most likely break the functionality of the application. There is even an option to pass the main ``playcanvas`` object as a constructor parameter of ``URLMesh`` and ``StreamMesh``:

```javascript
import { URLMesh, StreamMesh } from "@mantisvision/ryskplaycanvas";
import * as PlayCanvas from "playcanvas";

const ryskUrl = new URLMesh({
	mediaurl: "video_url",
	dataurl: "data_url",
	frameBufferSize: 25,
	playCanvas: PlayCanvas
});
const ryskStream = new StreamMesh({
	mediastream: MediaStream,
	playCanvas: PlayCanvas
});
```
where ``frameBufferSize`` is an initial size of the RYSK data buffer (by default it's 50) and ``PlayCanvas`` is the main object of PlayCanvas engine library.

Alternatively, ``MantisRYSKPlayCanvas.min.js`` file can be used on its own. It creates ``window.Rysk`` global variable
which contains ``URLMesh`` and ``StreamMesh`` classes. When using PlayCanvas editor, this file needs to be uploaded as 
an asset and then imported inside a custom script attached to an entity. An example of such a script is packed together
with ``MantisRYSKPlayCanvas.min.js`` inside ``examples`` subdirectory.
The call to construct both classes is slightly different:

```javascript
const ryskUrl = new window.Rysk.URLMesh({
	mediaurl: "video_url",
	dataurl: "data_url",
	frameBufferSize: 25,
	playCanvas: PlayCanvas
});
const ryskStream = new window.Rysk.StreamMesh({
	mediastream: MediaStream,
	playCanvas: PlayCanvas
});
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
	this.ryskObj = new window.Rysk.URLMesh({
		mediaurl: "video_url",
		dataurl: "data_url",
		playCanvas: pc,
		autoinit: {
			onSuccess(result)
			{
				const entity = result.mesh;
				entity.enabled = true; //entity is by default disabled
				this.entity.addChild(entity);
			},
			onError: console.error
		}
	}); 
});
```
An example PlayCanvas editor script ins included in the npm package in ``examples`` folder. It should be attached to the
entity which ought to represent the 3D mesh in the scene and can be configured through its attributes. 

## Public API:
Exported class ``URLMesh`` extends class ``RYSKUrl`` from ``@mantisvision/ryskurl`` and exported class ``StreamMesh``
extends class ``RYSKStream`` from ``@mantisvision/ryskstream``. You can find the description of their API [here](./ryskurlryskstream.md).

Both classes override the ``init`` method. Aside of the canvas and the media element, these methods also add the PlayCanvas entity object which can be used in the scene. Object's texture and geometry gets automatically updated; there is therefore no need to listen on ``dataDecoded`` event from parent classes.  
Similar behavior can be seen with the callback passed to `autoinit` property of the configuration object in the classes' constructors.

There is one new method ``getEntity()`` which works similarly to ``getCanvas()``, but returns PlayCanvas entity instead
(remember that both these methods work only after ``init()`` method is called for the first time, otherwise they return null).

WARNING! If you use the `init` method, even though it's marked as async, you shouldn't structure your code in a way you "await" till the promise returned from `init` resolves, and only then call `play`!. In order to resolve with an entity, `init` method requires you to also call ``play`` (before or after) because the mesh can only be constructed after at least one frame from the video is played.

The previous restriction can be bypassed by setting the preview mode via ``setPreviewMode(true)`` method. The method is inherited from ``RYSKUrl``, but here it's effect is even more prominent as it also allows to obtain the PlayCanvas entity from the ``run()`` method prior to calling the ``play()``. Furthermore, the method is expanded by allowing to pass not only ``true`` or ``false``, but also values from the ``PreviewMode`` enum; namely:
- ``PreviewMode.disabled`` - same as passing ``false``
- ``PreviewMode.full`` - same as passing ``true``
- ``PreviewMode.partial`` - the new mode which at the beginning shows only gray, untextured mesh (i.e. doesn't internally call ``play()`` on the video texture). This can save some bandwidth and is in theory less prone to provoke a negative reaction from the browser due to autoplay restrictions. It is worth noting that the behavior when calling the ``jumpAt()`` method remains the same with the ``partial`` and the ``full`` modes (so the mesh is once again fully textured and not just gray).
The preview mode can be also set in the constructor's configuration object via the `previewMode` property.

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

const ryskObj = new URLMesh({
	mediaurl: "video_url",
	dataurl: "data_url",
	playCanvas: pc,
	previewMode: PreviewMode.full,
	autoinit: {
		onSuccess(result)
		{
			const entity = result.mesh;
			entity.enabled = true; //entity is by default disabled
			app.root.addChild(entity);
		},
		onError: console.error
	}
});
app.start();
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
Connects to [3.2.0](./ryskurlryskstream.md#320) release of ``@mantisvision/ryskurl``.

### 0.11.0
Connects to [3.3.0](./ryskurlryskstream.md#330) release of ``@mantisvision/ryskurl``.

#### 0.11.4
Important bugfix from [0.6.2](./buffer.md#062) release of ``@mantisvision/ryskbuffer``.

#### 0.11.9
Important bugfix from [0.6.5](./buffer.md#065) release of ``@mantisvision/ryskbuffer``.

### 0.12.0
``@mantisvision/ryskdownloader`` version [0.7.0](./downloader.md#070) is incorporated.

### 0.13.0
Added caching of .syk files into IndexedDB where available (``@mantisvision/ryskdownloader`` version [0.8.0](./downloader.md#080)). The caching is made to persist only a single session in the browser.

### 0.16.0
Better code organization which relates to [@mantisvision/splatthreejs](./splatthreejs.md) package.

#### 0.16.1
Bumped version because [@mantisvision/utils](./utils.md) and [@mantisvision/ryskbuffer](./buffer.md) removed `update()` method.
